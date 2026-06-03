# 恢复 GitHub Actions 自动同步

## 改动背景 / 需求

用户已在 GitHub PAT 设置中开通 **workflow** 权限。此前因权限不足，`.github/workflows/gallery-sync-deploy.yml` 无法 push，已从 master 移除。现恢复工作流，使手机改款式写入 `master` 后自动 sync 并 deploy 到 gh-pages。

## 涉及文件

- `.github/workflows/gallery-sync-deploy.yml` — 监听 `public/**`、分类/ overrides 变更，执行 `sync-gallery`、提交 `galleryAlbums.js`、build 并推 gh-pages

## 行为变化

- 店主手机添加/删除款式 → 写入 GitHub `master` → Actions 约 1～3 分钟自动更新顾客站
- 无需每次改完再手动 `npm run deploy`（除非 Actions 失败）

## 验证方式

1. 本机 `git push origin master` 成功且无 workflow 权限报错
2. GitHub 仓库 **Actions** 页出现 workflow 运行记录
3. 手机添加测试款式后，顾客扫码页约 1 分钟可见新图

## Git 提交

- **是否已提交**：是
- **本地 commit**：34da512（nail-beauty / master / 已 push）
- **提交说明**：feat: 恢复 GitHub Actions 自动同步 deploy
- **PAT 权限**：已验证 `repo, workflow`
