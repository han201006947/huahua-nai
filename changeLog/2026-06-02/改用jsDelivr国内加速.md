# 改用 jsDelivr CDN 解决国内微信/浏览器均慢

## 改动背景

用户反馈微信和浏览器都慢。图片压缩后仍慢，因 **github.io 服务器在国外**，HTML/JS/图片走 GitHub Pages 在国内延迟高。

## 涉及文件

- `vite.config.js`（注入 `__CDN_BASE__`）
- `src/utils/assetUrl.js`（图片/视频走 jsDelivr）
- `scripts/inject-site-url.mjs`（app.js、style.css、价目图 preload 改 jsDelivr）
- `src/components/GallerySection.vue`（视口内才加载缩略图）
- `scripts/optimize-dist-images.mjs`（thumb 320px、主图更小）

## 行为变化

- 线上构建时静态资源改为：`https://cdn.jsdelivr.net/gh/han201006947/huahua-nai@gh-pages/...`
- jsDelivr 在国内有节点，比直连 github.io 快
- 作品集缩略图滚到附近才加载，减少首屏争抢
- **须 deploy 后生效**；jsDelivr 同步 gh-pages 约需 5–10 分钟

## 验证方式

1. 连上 GitHub 后执行 `npm run deploy`
2. 等 5–10 分钟，打开 https://han201006947.github.io/huahua-nai/?t=5
3. 开发者工具 Network 里图片/JS 域名应为 `cdn.jsdelivr.net`

## Git 提交

- **是否已提交**：否（待 commit 后回填）
- **本地 commit**：—
- **提交说明**：—
