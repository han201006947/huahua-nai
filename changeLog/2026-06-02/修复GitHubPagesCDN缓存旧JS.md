# 修复 GitHub Pages CDN / 浏览器缓存旧 JS

## 改动背景

资源路径修复（`assetUrl`）已推送到 `gh-pages`，但 GitHub Pages CDN 仍长时间返回旧版 `app.js`（含 `/caihui/...` 根路径），导致用户仍看不到图片、视频和微信二维码。

## 涉及文件

- `scripts/fix-dist-html.ps1`

## 行为变化

- 构建后为 `app.js` 追加 `?v=时间戳` 查询参数，强制浏览器拉取最新脚本
- 修复 PowerShell 脚本语法，确保 `app.js` 仍在 `#app` 之后加载

## 验证方式

1. 打开 https://han201006947.github.io/huahua-nai/assets/app.js 应含 `./caihui/c1` 与 `assetUrl`
2. 手机/微信：**关闭页面重新打开**，或清除缓存后再访问
3. 确认联系页二维码、作品集图片与视频正常

## Git 提交

- **是否已提交**：是
- **本地 commit**：1a6b1e0（master，未 push）
- **提交说明**：fix: app.js 构建时间戳破除 GitHub Pages 缓存
