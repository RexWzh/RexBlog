# Deploy Notes

当前第一阶段部署方案已经收敛为 `GitHub Pages`。

## 正式站点

- 来源：`main` 分支
- 构建：GitHub Actions
- 发布：推送到 `gh-pages` 分支，由 GitHub Pages 以 branch 模式托管

## PR Review 站点

- 来源：Pull Request 构建产物
- 发布位置：`gh-pages` 分支下的独立后缀路径
- 路径格式：`/pr-preview/pr-<number>/`

例如：

```text
https://<owner>.github.io/<repo>/pr-preview/pr-123/
```

## GitHub 设置

为了让正式站点和 PR review 站点共存，需要使用以下设置：

1. 在仓库 `Settings > Pages` 中，将 Source 设置为 `Deploy from a branch`
2. Branch 选择 `gh-pages`
3. 在仓库 `Settings > Actions > General` 中，将 Workflow permissions 设置为 `Read and write permissions`

正式发布 workflow 会更新 `gh-pages` 根目录，但保留 `pr-preview/` 目录；PR preview workflow 会在同一个 `gh-pages` 分支下写入或清理 `/pr-preview/pr-<number>/`。

## 当前结论

- 第一阶段不引入自建 deploy hook。
- 第一阶段不引入额外服务器接收端。
- 如果未来需要统一管理多个模型产出网站，再考虑把部署收口到服务端。
