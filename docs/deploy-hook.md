# Deploy Hook 方案（可选扩展）

当前默认部署方式已经切换为标准 `hexo-deployer-git`，即 `hexo d` 直接发布构建后的静态站点。

本文件保留为后续扩展方案：如果未来需要把部署控制统一收口到服务端，再启用 deploy hook 模式。

## 目标

- 只允许 GitHub Actions 触发部署。
- 不让每台内容产出机器直接接触服务器。
- 让服务器保留最终部署控制权。
- 保留审计、回滚和幂等能力。

## 推荐链路

1. 多台机器将内容同步到各自的 `machine/*` 分支。
2. 需要发布的内容合并到 `main`。
3. GitHub Actions 在 `main` 更新后执行 `npm ci` 和 `npm run build`。
4. 构建通过后，Actions 向服务器的 deploy hook 发起签名请求。
5. 服务器验证请求后，自己拉取仓库、构建站点、切换发布目录。

这样做的重点是：

- GitHub 是唯一汇总入口。
- `main` 是唯一发布分支。
- 服务器只暴露一个受控接口。
- 真正接触服务器的只有 GitHub Actions 和服务器本身。

## GitHub 侧配置

除了 GitHub Actions，这个仓库还支持本地执行 `hexo d` 走同一个 deploy hook。也就是说，Actions 和本地 `hexo d` 可以共用同一套服务端发布入口。

本地 `hexo d` 的说明见 `docs/hexo-chattool-deployer.md`。

### Secrets

- `DEPLOY_HOOK_URL`: 服务器部署接口地址，例如 `https://deploy.example.com/hooks/rexblog`
- `DEPLOY_HOOK_TOKEN`: 与服务器共享的 HMAC 密钥

### Variables

- `DEPLOY_TARGET`: 可选，默认 `rexblog-production`

## 请求格式

### 请求头

- `Content-Type: application/json`
- `X-Deploy-Timestamp: 2026-04-07T16:30:00Z`
- `X-Deploy-Signature: sha256=<base64-hmac>`
- `X-GitHub-Repository: RexWzh/RexBlog`
- `X-GitHub-Run-Id: <run-id>`

### 请求体示例

```json
{
  "repo": "RexWzh/RexBlog",
  "ref": "main",
  "sha": "74ab4af...",
  "actor": "RexWzh",
  "run_id": "1234567890",
  "run_attempt": "1",
  "run_url": "https://github.com/RexWzh/RexBlog/actions/runs/1234567890",
  "target": "rexblog-production",
  "requested_at": "2026-04-07T16:30:00Z"
}
```

## 签名规则

GitHub Actions 使用 `DEPLOY_HOOK_TOKEN` 作为共享密钥，对原始请求体计算 HMAC-SHA256，再使用 Base64 编码。

请求头格式：

```text
X-Deploy-Signature: sha256=<base64-hmac>
```

服务器校验步骤建议如下：

1. 校验 `X-Deploy-Timestamp` 是否在允许窗口内，例如 5 分钟。
2. 使用保存的共享密钥，对原始 body 重新计算 HMAC-SHA256。
3. 与 `X-Deploy-Signature` 做常量时间比较。
4. 校验 `repo` 是否等于 `RexWzh/RexBlog`。
5. 校验 `ref` 是否等于 `main`。
6. 基于 `sha + run_id + run_attempt` 做幂等去重。

## 服务器职责

deploy hook 不应该直接在 HTTP 请求线程里做完整构建，最好采用“校验后入队”或“拿到锁后串行部署”的方式。

最小可用部署步骤：

1. 获取部署锁，防止并发发布。
2. `git fetch origin --prune`
3. 校验目标提交 `sha` 是否存在于 `origin/main`
4. 切到目标提交或对应 release worktree
5. 执行 `npm ci`
6. 执行 `npm run build`
7. 将产物发布到新的 release 目录
8. 原子切换当前线上目录或软链接
9. 记录部署日志、提交号、触发人和 Actions run URL

## 推荐目录结构

```text
/srv/rexblog/
  repo/
  releases/
    20260407-163000-74ab4af/
  current -> /srv/rexblog/releases/20260407-163000-74ab4af/
  logs/
```

Web 服务只指向 `current/public/`，部署时切换 `current` 即可。

## 返回格式建议

### 成功

```json
{
  "ok": true,
  "deployment_id": "20260407-163000-74ab4af",
  "status": "accepted"
}
```

### 失败

```json
{
  "ok": false,
  "error": "invalid signature"
}
```

推荐状态码：

- `202`: 已接受，进入部署队列
- `400`: 请求格式错误
- `401`: 鉴权失败
- `409`: 当前已有部署进行中
- `500`: 服务端内部错误

## 为什么选择这个方案

- 比“每台机器直连服务器”安全得多。
- 比“纯 GitHub Actions 直接 SSH”更容易收敛部署逻辑。
- 比“先上传静态产物再下发”更容易保持服务器端的可回滚能力。
- 后面如果不只部署博客，也可以复用同一个 deploy hook 服务。

## 最小服务端约定

如果后面使用 `chattool serve` 来承载这个服务，建议至少具备以下能力：

- HTTPS
- Token/HMAC 校验
- 简单的 allowlist
- 串行部署锁
- 部署日志
- 部署历史保留
- 失败告警或至少失败记录
