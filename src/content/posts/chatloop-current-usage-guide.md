---
title: ChatLoop 使用指南：怎么启动、怎么判断生效、怎么看日志
date: 2026-04-20T23:50:00+08:00
description: 面向当前版本的 ChatLoop，用最小闭环讲清楚：启动前要准备什么、命令分别做什么、怎么判断 loop 真的在工作，以及常见日志标题到底代表什么。
permalink: /2026/04/20/chatloop-current-usage-guide/
tags:
  - ai
  - agent
  - workflow
  - engineering
  - chatloop
feature: true
---

> `[LOOP.STATUS] > Project resolved.`
> `[LOOP.STATUS] > PRD contract injected.`
> `[LOOP.STATUS] > Waiting for the next idle checkpoint.`

如果你第一次接触当前版 `chatloop`，最容易踩的坑不是“命令不会用”，而是：

- 以为启动成功就代表 loop 已经在稳定运行
- 以为模型写了 `DONE`，插件就一定会停
- 看到一长串日志标题，却不知道哪些是正常现象，哪些才是真问题

所以这篇文章不讲历史演进，只讲当前版本：

1. **怎么用**
2. **怎么判断它是否真的生效**
3. **怎么读懂 `chatloop.events.log`**

## 一、ChatLoop 当前版到底是什么

当前版 `chatloop` 是一个 **PRD-aware 的自动续推插件**。

它的核心行为是：

- 要求当前目录本身直接存在 `PRD.md`
- 把当前目录视为当前 project root
- 在启动首轮就注入 PRD contract，而不是裸转发用户消息
- 当 session 进入 idle 后，自动继续下一轮
- 要求每轮输出结构化进度：
  - `## Completed`
  - `## Next Steps`
  - `STATUS: IN_PROGRESS` / `STATUS: COMPLETE`
- 只有在 completion gate 真正通过时才停止

换句话说，`chatloop` 现在不只是“帮你多发一条 prompt”，而是一套围绕 `PRD.md` 运转的小状态机。

## 二、使用前要准备什么

最少需要：

```text
PRD.md
```

可选但推荐：

```text
memory.md
progress.md
```

其中：

- `PRD.md` 是主入口
- `memory.md` 是局部上下文
- `progress.md` 是阶段进展

如果当前目录本身没有 `PRD.md`，`chatloop` 就不会真正工作。

## 三、最小正确用法

### 1. 先确认当前 project 解析对不对

执行：

```text
/chatloop-project
```

这个命令会直接告诉你：

- `Project root`
- `PRD entry`
- `State file`
- `Events file`
- `Active`
- `Iteration`
- `Mode`

如果这里的 `Project root` 或 `PRD entry` 就不对，后面 loop 一定也不对。

### 2. 再启动 loop

最常见的普通模式：

```text
/chatloop 按当前 PRD 推进任务。必要时参考 memory.md 和 progress.md；每轮输出 ## Completed、## Next Steps 和 STATUS: IN_PROGRESS / STATUS: COMPLETE。
```

如果你要更接近 Ralph Loop 的 refresh-session 风格：

```text
/chatloop-ralph 按当前 PRD 推进任务。必要时参考 memory.md 和 progress.md；每轮输出 ## Completed、## Next Steps 和 STATUS: IN_PROGRESS / STATUS: COMPLETE。
```

两者区别很简单：

- `/chatloop`
  - continuation 发生在同一个 session
- `/chatloop-ralph`
  - 每次 continuation 都创建一个新的 session，并把 TUI 切到那个新 session

### 3. 如果当前任务完成，要整理给下一轮需求讨论

执行：

```text
/chatloop-next
```

它会引导模型做这些事：

- 把当前任务长期输出收口到 project 内 `reference/`
- 更新 `memory.md`
- 更新 `progress.md`
- 把 `PRD.md` 整理成下一轮讨论入口

这个命令不是继续 loop，而是**整理交接面**。

## 四、当前版本的重要规则

### 1. 首轮 bootstrap 不允许直接完成

这是当前版非常关键的一条。

bootstrap 首轮：

- 必须使用 `STATUS: IN_PROGRESS`
- 不允许 `STATUS: COMPLETE`
- 不允许 `<complete>DONE</complete>`

原因很直接：

很多模型一上来会条件反射地先做一个“总结式完成”输出。如果首轮就允许完成，loop 基本等于没有启动。

### 2. completion gate 不是只看 `DONE`

当前停止条件不是只看：

```text
<complete>DONE</complete>
```

还要同时满足：

- 有 `STATUS: COMPLETE`
- 没有 `STATUS: IN_PROGRESS`
- `## Next Steps` 里没有未完成的 `- [ ]`
- 不是 bootstrap 首轮

所以模型“口头上说完成了”，不代表插件就会接受。

## 五、怎么判断它真的生效了

最稳的判断方式有三层。

### 第一层：看命令级信息

- `/chatloop-project`
  - 看 project / PRD / 文件路径
- `/chatloop-status`
  - 看 loop 状态和最近一次 lifecycle 结果

当前版 `/chatloop-status` 现在至少能告诉你：

- `State active flag`
- `Armed for continuation`
- `Iteration`
- `Structured next steps pending`
- `Last lifecycle event`
- `Last lifecycle reason`
- `Mode`

这已经比早期版本可用很多了。

### 第二层：看状态文件

```text
.opencode/chatloop.local.md
```

它会保留当前 loop 的关键信息：

- active
- sessionId
- projectPath
- iteration
- maxIterations
- mode
- lastEvent
- lastReason

### 第三层：看事件日志

```text
.opencode/chatloop.events.log
```

这是最底层的事件流，也是最终 source of truth。

## 六、常见日志标题是什么意思

下面这些 title 是最常见的，你只要先认识它们，绝大多数排查都会轻松很多。

### `chatloop.start.prompt`

表示：

- loop 已经开始构造 bootstrap prompt
- 当前 project 和 `PRD.md` 已经解析成功

例如你贴的这条：

```text
2026-04-19T21:21:51.520Z | INFO  | chatloop.start.prompt | session=... | mode=bootstrap prd=/path/to/PRD.md original_task=yes
```

重点看三个字段：

- `mode=bootstrap`
  - 说明这是首轮启动，不是 continuation
- `prd=.../PRD.md`
  - 说明当前注入的是哪个 `PRD.md`
- `original_task=yes`
  - 说明你执行 `/chatloop ...` 时确实传入了原始任务文本

如果你这里看到的不是 `PRD.md`，而是旧的 `task.md` / `review.md`，那通常说明你跑到的不是当前插件版本。

### `chatloop.start.prompt_sent`

表示：

- bootstrap prompt 已经真正发给当前 session

这比单纯的 `chatloop.start` 更接近“首轮已经真的启动”。

### `chatloop.observe.session.status`

表示：

- 插件观察到了 session 状态变化

例如：

```text
chatloop.observe.session.status | status=idle
chatloop.observe.session.status | status=busy
```

这不是 continuation 本身，而是“续跑前的状态观察”。

### `chatloop.observe.session.idle`

表示：

- OpenCode 发来了 `session.idle` 事件

这通常意味着：

- 模型本轮停下来了
- 插件准备判断要不要继续

### `chatloop.idle.observe`

表示：

- 插件已经开始处理一次 idle checkpoint
- 会顺手打印：
  - 当前是否 active
  - session 是否匹配
  - 当前 iteration

### `chatloop.idle.skip`

表示：

- 这次 idle 没有真正触发 continuation

常见 reason：

- `handler_busy`
  - 双 idle 事件同时来了，但已有一个 handler 在处理，这通常是正常现象
- `inactive_state`
  - 当前 state 已经不是 active
- `session_mismatch`
  - 当前事件 session 和 state 里登记的 session 不一致
- `debounced`
  - 太近了，被 debounce 掉
- `session_not_idle`
  - 再查一次发现 session 其实还没真的 idle

### `chatloop.idle.last_text`

表示：

- 插件已经把最近一次 assistant 文本拉回来了
- 接下来会用它来：
  - 提取 `Completed`
  - 提取 `Next Steps`
  - 判断 completion 是否有效

### `chatloop.state.updated`

表示：

- state 已经推进到下一轮

你会看到类似：

```text
iteration=3/20 completed=yes next_steps=yes
```

这说明：

- loop 真正在往前走
- 而不是只是空观察

### `chatloop.idle`

表示：

- continuation prompt 即将发送

例如：

```text
chatloop.idle | source=session.status sending continuation iteration=3
```

这是最关键的一条之一，因为它意味着：

- 插件决定继续跑了

### `chatloop.idle.prompt_sent`

表示：

- continuation prompt 已经真正发出

如果你看到了：

- `chatloop.state.updated`
- `chatloop.idle`
- `chatloop.idle.prompt_sent`

那基本可以认定：

- 这一轮 continuation 已经生效

### `chatloop.complete.rejected`

表示：

- 模型看起来像完成了
- 但 completion gate 没接受

常见 reason：

- `missing completion tag`
- `missing STATUS: COMPLETE`
- `STATUS: IN_PROGRESS contradicts completion`
- `unchecked next steps remain`
- `bootstrap iteration cannot complete`

这条日志非常重要，因为它通常就是“为什么明明 DONE 了还在继续跑”的直接答案。

### `chatloop.complete`

表示：

- 这次 completion gate 通过了
- state 会被清掉
- loop 将停止

### `chatloop.max_iterations`

表示：

- 不是任务自然完成
- 而是到达了上限轮次后被强制停下

### `chatloop.pause`

表示：

- loop 被错误或异常暂停

当前最常见来源是：

- `session.error`

### `chatloop.observe.message.part.tool`

你提到的这一类：

```text
chatloop.observe.message.part.tool
```

它不是 loop 控制事件，而是**模型这一轮里调用 tool 的底层观测日志**。

它通常会告诉你：

- 调用了哪个 tool
- 当前状态是：
  - `pending`
  - `running`
  - `completed`

例如：

```text
chatloop.observe.message.part.tool | tool=read status=running
```

这表示：

- 模型这轮正在执行 `read`
- 并不表示 loop 自己出问题了

所以：

- `chatloop.observe.*` 更偏**观测层**
- `chatloop.idle / complete / max_iterations / pause` 更偏**状态机层**

## 七、普通模式和 Ralph 模式怎么选

### `/chatloop`

适合：

- 你希望在同一个 session 里持续推进
- 想保留当前会话的上下文连续性

### `/chatloop-ralph`

适合：

- 你想要更接近 Ralph Loop 的 refresh 风格
- 希望每一轮 continuation 都切到一个新的 session

它更接近“每轮重新开机再继续”，而不是“在一个会话里无限拉长”。

## 八、最小推荐调试顺序

如果你只想记住一套最实用的顺序，就按这个来：

1. 先看：

```text
/chatloop-project
```

2. 再启动：

```text
/chatloop 按当前 PRD 推进任务
```

或：

```text
/chatloop-ralph 按当前 PRD 推进任务
```

3. 如果过程异常，再看：

```text
/chatloop-status
```

4. 还不清楚，就直接读：

```text
.opencode/chatloop.events.log
```

重点先找：

- `chatloop.start.prompt`
- `chatloop.start.prompt_sent`
- `chatloop.idle`
- `chatloop.idle.prompt_sent`
- `chatloop.complete.rejected`
- `chatloop.complete`

## 九、结语

当前版本的 `chatloop`，最值得用的地方，不是“它会不会自己无限跑”，而是：

- 它已经围绕 `PRD.md` 建起了一套明确的工作入口
- 它开始拥有能解释自己行为的日志和状态
- 它不再只是“有一个命令”，而是开始变成一台可观测、可判断、可收敛的 loop 机器

而真正让它用起来顺手的关键，并不是再多记几个命令，而是学会看懂这几条日志标题。

因为从那一刻开始，你看到的就不再是一堆“奇怪的 DEBUG 输出”，而是一台正在工作的系统。

---
*End of transmission.*
