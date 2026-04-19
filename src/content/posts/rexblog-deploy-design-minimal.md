---
title: RexBlog 部署设计：最小可实现方案
date: 2026-04-07T17:35:00+08:00
tags:
  - design
  - deployment
  - astro
  - workflow
description: 基于 Astro 与 GitHub Pages，收敛 RexBlog 的最小部署与多机协作方案。
permalink: /2026/04/07/rexblog-deploy-design-minimal/
---

> `[SYS.DEPLOY] > Initializing deployment strategy...`

这篇文章只讨论一件事：如何给 `RexBlog` 做一个足够简单、足够安全、并且后面还能继续演进的部署设计。

随着我们将框架从 Hexo 彻底迁移至 Astro，部署策略也需要随之更新。这里不凭空设计，而是优先参考现代静态站点生成器（SSG）与云原生托管平台的最佳实践。

目标不是一开始把体系做复杂，而是让这套“PR 驱动”的流程能极度稳定地跑起来。

## 核心边界：源码与产物的分离

在过去，很多博客使用者习惯在本地执行构建并强行推送静态文件。现在，我们必须将这两个动作在物理和语义上彻底分开：

- `git push`：只负责同步**源码仓库**（Markdown、组件、配置）。
- `GitHub Actions`：负责在云端执行构建（`npm run build`），并将生成的静态产物（`dist/`）发布到托管环境。

如果这两件事混在一起，一旦引入多机协作或多 Agent 自动生成内容，链路就会发生灾难性的冲突。

## 当前确定的最小可用路线

基于 Astro 的特性与我们的“多节点/Agent 协作”需求，当前最通用、最可靠的路线是：

### GitHub Pages + GitHub Actions (当前采用)

这是 Astro 官方文档直接推荐的第一梯队方式，也是我们目前正在使用的基线方案。

**基本流程**：
1. 本地或 Agent 将源码 push 到 GitHub 仓库的 `main` 分支（或通过 PR 合并）。
2. GitHub Actions 监听到 `main` 的变更，启动一个干净的 Node 容器。
3. 执行 `npm ci` 安装依赖，执行 `npm run build` 构建 Astro 站点。
4. 使用 GitHub 官方的 Deploy Action，将 `dist/` 目录直接推送到 GitHub Pages 的特殊分支（如 `gh-pages`）或直接通过 artifact 部署。

**优势**：
- **零运维**：不需要自己维护服务器、Nginx 或 SSL 证书。
- **绝对干净**：每次构建都在隔离的容器中进行，杜绝了“我本地能跑”的玄学问题。
- **天然契合 PRD-Driven**：非常适合 Agent 提交 PR，人类 Review 后 Merge 触发发布的流程。

## 其他备选托管平台

如果未来我们需要更强的边缘计算能力或预览环境，可以随时无缝迁移至以下平台（Astro 对它们都有官方的第一方集成支持）：

### Cloudflare Pages
**优势**：全球最快的 CDN 之一，自带极其强大的免费 DDoS 防护，且对 PR 自动生成预览链接（Preview Deployments）的支持最为开箱即用。

### Vercel / Netlify
**优势**：前端领域的行业标杆。如果未来我们的博客需要引入 SSR（服务端渲染）或 Serverless API，这两个平台能提供最平滑的升级体验。

## 为什么当前不推荐自建接收端 (Webhook Server)

如果在自己的 VPS 上跑一个类似 `chattool serve` 的服务，通过鉴权 token 接收 GitHub Webhook，再在服务器上 `git pull` 和构建，虽然听起来很极客，但在当前阶段是**反模式**的。

- **徒增复杂度**：你需要自己处理 HTTPS、Token 鉴权、重放攻击防护、Node 环境维护。
- **单点故障**：自建服务器挂了，部署就断了。
- **违背 Serverless 哲学**：对于纯静态站点，现成的托管平台已经提供了 CDN、HTTPS 和原子化部署，没有理由退回到手动运维的时代。

## Workflow 最小化实践

当前阶段的 Git Workflow 被压缩到了极致的简单：

### 1. 实验分支 (Feature / Agent Branches)
- 任何本地机器或 Agent，都在独立的分支（如 `agent/update-post`）上工作。
- 提交 PR 时，CI 仅做构建检查（Build Check），不执行发布。

### 2. 主分支 (Main)
- `main` 分支是被保护的。
- 只有合并到 `main`，才会触发真实的部署流水线，将内容同步到公网。

## 本地控制台指令

开发者或 Agent 在本地进行调试时，只需要掌握最基础的 npm 脚本：

```bash
# 启动本地响应式预览服务器
npm run dev

# 运行本地全量构建检查
npm run build

# 预览构建后的静态产物
npm run preview
```

发布不再依赖本地的任何构建动作，一切以云端 CI 的执行结果为准。

---
*End of transmission.*
