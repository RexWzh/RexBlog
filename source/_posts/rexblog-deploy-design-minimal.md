---
title: RexBlog 部署设计：最小可实现方案
date: 2026-04-07 17:35:00
tags:
  - design
  - deployment
  - hexo
  - workflow
description: "基于 Hexo、GitHub Pages、Cloudflare Pages、Netlify 官方资料，收敛 RexBlog 的最小部署方案。"
---

这篇文章只讨论一件事：如何给 `RexBlog` 做一个足够简单、足够安全、并且后面还能继续演进的部署设计。

这里尽量不凭空设计，而是优先参考官方已经支持的静态站点部署方式。

参考来源主要是：

- Hexo 官方文档
- GitHub Pages 官方 / Hexo 官方 GitHub Pages 指南
- Cloudflare Pages 官方 Hexo 指南
- Netlify 官方仓库部署文档

目标不是一开始把体系做完整，而是先让这套流程能稳定跑起来。

## 先定义边界

这里有两个动作，必须分开：

- `git push`：同步源码仓库
- `hexo d`：部署构建后的静态站点

这两个动作虽然都可能发生在“发布”附近，但语义不同。

`git push` 解决的是内容协作和源码同步。

`hexo d` 解决的是把当前站点构建结果发布到线上。

如果这两件事混在一起，后面一旦多机协作、Actions 自动化、服务端接收端同时存在，链路就会越来越难理解。

## 先看官方已经支持的最小路线

基于官方文档，目前最常见、也最通用的路线其实很清楚：

### 路线一：GitHub Pages + GitHub Actions

这是 Hexo 官方文档直接推荐的方式之一。

基本流程：

1. 源码 push 到 GitHub 仓库默认分支
2. GitHub Actions 执行 `npm run build`
3. 将 `public/` 发布到 GitHub Pages

优点：

- 对 Hexo 最官方
- 配置简单
- 安全性高，不需要自建服务器
- 适合个人博客

限制：

- 网站托管能力受 GitHub Pages 限制
- 预览和扩展能力比 Cloudflare Pages 弱一些

### 路线二：Cloudflare Pages + Git 集成

Cloudflare 官方对 Hexo 有明确的 framework guide。

基本流程：

1. 把 `RexBlog` 源码推到 GitHub
2. Cloudflare Pages 连接 GitHub 仓库
3. 设置：
   - Production branch: `main`
   - Build command: `npm run build`
   - Build directory: `public`
4. 每次提交自动构建部署
5. Pull Request 自动生成 preview deployment

优点：

- 配置非常少
- 默认就适合静态站点
- PR 预览是现成能力
- 自定义域名和 CDN 能力很成熟
- 不需要自己维护服务器

限制：

- 依赖第三方平台托管

### 路线三：Netlify + Git 仓库部署

Netlify 官方也支持直接从 Git 仓库部署。

基本流程与 Cloudflare Pages 类似：

1. 连接 GitHub 仓库
2. 配置构建命令和发布目录
3. 平台自动构建和托管静态产物

优点：

- 同样是成熟平台方案
- 对静态博客非常友好
- 自定义域名、预览、托管能力成熟

限制：

- 对 Hexo 来说，生态心智上没有 GitHub Pages / Cloudflare Pages 那么直接

## 现在最不该先做的事

如果目标是“快速实现 + 通用 + 安全”，现在最不该先做的是：

- 自建部署 API
- 自己处理 token / HMAC / 重放保护
- 自己维护部署服务
- 自己维护接收端和队列

这些事情都不是不能做，而是太早做会明显提高复杂度。

对于一个 Hexo 静态博客，现成托管平台已经覆盖了最关键的能力：

- 自动构建
- 自动托管
- 自定义域名
- HTTPS
- PR 预览
- GitHub 集成

## 最小方案

我建议当前阶段采用最简单的版本：

1. 源码仓库使用 `RexBlog`
2. 主分支使用 `main`
3. 普通分支和 PR 只做构建校验
4. 正式托管优先使用 GitHub Pages 或 Cloudflare Pages
5. 不自建部署接收端

这个方案里不引入额外的部署服务，不引入复杂的任务编排，也不引入一开始就必须维护的 `chattool serve` 接收端。

## 推荐结论

如果只考虑“最安全、最通用、最快能做出来”，我建议这样选：

### 第一推荐：Cloudflare Pages

原因：

- 官方对 Hexo 有直接文档
- 接 GitHub 仓库非常直接
- `main` 自动发布
- PR 自动预览
- HTTPS、CDN、自定义域名都现成
- 不需要你自己管服务器

如果你的重点是“把站稳定放出去，并且希望 MR / PR 有预览”，Cloudflare Pages 是最省事的。

### 第二推荐：GitHub Pages

原因：

- Hexo 官方文档直接支持
- GitHub Actions workflow 有官方示例
- 对个人博客最经典
- 非常通用

如果你更想要“全部留在 GitHub 体系里”，GitHub Pages 是最稳的默认方案。

### 第三推荐：Netlify

原因：

- 也是成熟静态托管平台
- 部署方式和 Cloudflare Pages 类似

但对当前这个 Hexo 博客来说，我会先优先 Cloudflare Pages 或 GitHub Pages。

## 为什么当前不推荐自建接收端

不是 `chattool serve` 不好，而是当前阶段没有必要把复杂度抬高。

如果当前目标只是让博客稳定发布，那么最短路径其实就是：

- 源码 push 到 GitHub
- 平台自动构建 `public/`
- 平台自动 host 网站

这个链路有几个明显优点：

- 官方支持
- 配置简单
- 安全边界清楚
- 维护成本最低
- 没有服务器暴露问题

对于一个静态博客，这通常已经够用了。

## workflow 最小化

当前阶段 workflow 也不需要做复杂。

### 普通分支 push

- 只做构建检查
- 不正式发布

### PR / MR

- 做构建检查
- 如果平台支持，就自动给预览地址

### 合并到 `main`

- 自动触发正式构建
- 自动发布到托管平台

## 本地怎么用

本地继续保留简单用法：

```bash
hexo cl
hexo s
```

发布不再优先依赖本地 `hexo d`，而是优先依赖 Git 平台触发：

```bash
git add .
git commit -m "..."
git push
```

也就是说：

- 本地负责写内容和预览
- GitHub 负责同步源码
- 托管平台负责构建和 host 网站

这是当前最省心的方式。

## `hexo d` 还要不要保留

可以保留，但不应该是第一优先。

原因很简单：

- 现成托管平台已经能从源码仓库自动 build 和部署
- 继续依赖本地 `hexo d`，会让“本地发布”和“平台自动发布”变成两套路径

如果当前目标是减少概念和减少维护，我更建议：

- 先把正式发布统一收敛到平台自动部署
- `hexo d` 暂时不作为主路径

后面如果你确实需要“本地一键发布构建产物”，再重新引入 `hexo-deployer-git` 也不晚。

## 第二阶段再考虑什么

等下面这些需求真的出现时，再引入 `chattool serve` 更合适：

- 不止部署博客，还部署多个模型生成站点
- 需要统一接入部署日志和回滚
- 需要统一鉴权和部署队列
- 需要服务端接收层，而不是完全依赖第三方托管平台

那时 `chattool serve` 才真正有必要。

## 当前推荐的最终方案

如果只考虑“现在就能做、最安全、最通用、最少设计”，我推荐：

1. 源码仓库继续放在 GitHub
2. 正式托管优先选 Cloudflare Pages 或 GitHub Pages
3. 普通分支和 PR 只做构建检查
4. `main` 负责正式发布
5. 暂不自建 `chattool serve` 接收端

如果你问我只选一个，我会推荐：

1. 需要 PR 预览和更强托管体验：`Cloudflare Pages`
2. 需要最经典、最官方、最少心智负担：`GitHub Pages`

这就是当前阶段最小、最安全、最通用的方案。
