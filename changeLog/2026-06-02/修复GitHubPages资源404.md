# 修复 GitHub Pages 图片视频与微信二维码 404

## 改动背景

站点部署在 `https://han201006947.github.io/huahua-nai/` 子目录下，但资源路径写成了 `/wechat-qr.png`、`/caihui/...` 等**网站根路径**，浏览器会去 `github.io/wechat-qr.png` 加载，导致联系页二维码裂图、作品集图片和视频全部无法显示。

## 涉及文件

- `src/utils/assetUrl.js`（新增）
- `src/components/ContactSection.vue`
- `src/components/GallerySection.vue`
- `src/components/HeroSection.vue`
- `src/components/AboutSection.vue`
- `scripts/sync-gallery-albums.mjs`
- `src/data/galleryAlbums.overrides.js`
- `src/data/galleryAlbums.js`（sync 重新生成）

## 行为变化

- 新增 `assetUrl()`：把 `/maoyan/m1/m11.mp4` 转为 `./maoyan/m1/m11.mp4`，兼容 GitHub Pages 子目录与 `file://` 离线包
- 联系页微信二维码、Hero 价目图、关于页拼贴、作品集封面/详情/视频均经 `assetUrl` 输出
- 相册同步脚本生成的路径也改为 `./` 前缀

## 验证方式

1. 代理/VPN 连通 GitHub 后执行 `npm run deploy`
2. 打开 https://han201006947.github.io/huahua-nai/
3. 确认联系页微信二维码、作品集图片与视频均可正常加载

## Git 提交

- **是否已提交**：否（待 commit 后回填）
- **本地 commit**：—
- **提交说明**：—
