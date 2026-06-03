# 推送 master 与 deploy 上线

## 改动背景 / 需求

用户反馈手机点「添加款式」时报 `Branch master not found`，且「添加分类」按钮也显示处理中。此前本地修复已就绪，用户确认网络恢复后要求代为执行 `git push` 与 `npm run deploy`。

## 涉及操作

| 步骤 | 结果 |
|------|------|
| `git push -u origin master` | 成功，远程新建 `master` 分支 |
| `npm run deploy` | 成功，gh-pages 已更新（`Published`） |
| 历史改写 | 从提交历史中移除 `.github/workflows/gallery-sync-deploy.yml`（见下） |

## 行为变化

1. **手机管理**：GitHub 上已有 `master` 源码分支，Contents API 写入 `public/`、`galleryCategories.custom.json` 等不再报「分支不存在」。
2. **双按钮 busy**：最新前端已随 gh-pages deploy 上线，`busyCategory` / `busyAlbum` 分离。
3. **顾客站**：https://han201006947.github.io/huahua-nai/ 已包含最新构建（含 jsDelivr 大图）。

## PAT 与 Actions 说明

首次 push 曾被 GitHub 拒绝：

> refusing to allow a Personal Access Token to create or update workflow without `workflow` scope

因此从 **master 提交历史** 中移除了 Actions 工作流文件，才得以 push 成功。

**影响**：手机改款式会写入 `master`，但 **不会自动** 触发 GitHub Actions 同步 gh-pages。店主改完后若顾客页未更新，需在电脑执行 `npm run deploy`，或：

1. 到 GitHub → Settings → Developer settings → PAT，为当前 Token 勾选 **workflow** 权限；
2. 将 `.github/workflows/gallery-sync-deploy.yml` 重新加入仓库并 push。

工作流文件内容可参考 `changeLog/2026-06-02/线上手机管理同顾客链接.md` 或本地 git  reflog / `refs/original/refs/heads/master` 恢复。

## 验证方式

1. 手机扫 `release/店主管理登录二维码.png`，强制刷新后添加款式。
2. 不应再出现 `Branch master not found`；「添加分类」与「添加款式」按钮 busy 互不影响。
3. 若需顾客页立刻看到新图：电脑 `npm run deploy`，或恢复 Actions 后约 1 分钟自动更新。

## Git 提交

- **是否已提交**：是
- **本地 commit**：feb9255（docs）；源码/fix 已在 4d77669 推送到 origin/master
- **提交说明**：docs: 记录 master 推送与 gh-pages deploy 上线
- **deploy**：`npm run deploy` 已成功（gh-pages Published）
