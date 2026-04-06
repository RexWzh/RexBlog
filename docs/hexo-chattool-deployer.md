# Hexo Git Deploy Workflow

这个仓库当前采用和 `butterfly` 旧站一致的语义：

- `git push` 同步源码仓库
- `hexo d` 部署生成后的静态站点

这两件事是分开的。

## 核心思路

`hexo d` 使用标准 `hexo-deployer-git`，把 `public/` 目录复制到 `.deploy_git/`，再以 Git 方式推送到部署目标。

这样做的特点是：

- 符合 Hexo 习惯用法
- 和 `butterfly` 的工作流一致
- 部署的是构建产物，不是源码仓库
- 部署更新天然是 Git 差量

## 环境变量

运行 `hexo d` 时，部署目标通过 `CHATTOOL_*` 变量注入：

- `CHATTOOL_DEPLOY_REPO`: 必填，部署目标 git remote
- `CHATTOOL_DEPLOY_BRANCH`: 可选，默认 `main`
- `CHATTOOL_DEPLOY_TOKEN`: 可选，仅 HTTPS remote 需要
- `CHATTOOL_DEPLOY_MESSAGE`: 可选，覆盖 deploy commit message

如果 `CHATTOOL_DEPLOY_REPO` 是 HTTPS 地址，并且提供了 `CHATTOOL_DEPLOY_TOKEN`，运行时会自动把 token 交给 `hexo-deployer-git`。

## 典型用法

```bash
export CHATTOOL_DEPLOY_REPO="https://github.com/RexWzh/rexblog-public.git"
export CHATTOOL_DEPLOY_BRANCH="main"
export CHATTOOL_DEPLOY_TOKEN="<deploy-token>"

hexo cl
hexo s
hexo d
```

如果部署目标是服务器 bare repo，也可以使用 SSH remote，例如：

```bash
export CHATTOOL_DEPLOY_REPO="git@example.com:/var/repo/rexblog-static.git"
export CHATTOOL_DEPLOY_BRANCH="main"

hexo d
```

## GitHub Actions

GitHub Actions 也走同一条 workflow：

1. checkout 源码仓库
2. `npm ci`
3. `hexo deploy --generate`
4. 将 `public/` 推送到部署目标

也就是说：

- 本地 `hexo d`
- GitHub Actions `hexo d`

使用的是同一套部署语义，只是触发方不同。
