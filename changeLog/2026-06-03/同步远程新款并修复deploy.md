# 同步远程新款并修复 gh-pages 未部署

## 问题

- 手机上已添加 c5/c6/c7 等新款（master 已有 `caihui-c7`、revision 含 3 个 latestIds）
- 线上 gh-pages **仍是旧版 app.js**（无 `LatestStylesSection`、无 c5/c7）
- 原因：Actions 仅在 `public/**` 变更时触发，**前端代码 push 不会 deploy**

## 改动

1. 从 GitHub master 拉取 `galleryAlbums.js`、`gallery-revision.json`、c7 图片
2. 扩展 `.github/workflows/gallery-sync-deploy.yml`：`src/**` 变更也触发 build+deploy
3. 新增 `npm run sync-from-github` 脚本

## 远程 latestIds（当前）

`caihui-c7`, `caihui-c6`, `caihui-c5` → 最新款式区显示 3 款

## 验证

push master 后 Actions 绿勾 → 2～5 分钟扫码见「美甲服务」下方最新 3 款

## Git

- **是否已提交**：否
- **本地 commit**：—
