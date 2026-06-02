# 二次加速：缩略图 + 部署压缩版 + 破除 CDN 缓存

## 改动背景

用户反馈价目图与作品集仍然很慢。排查发现：**压缩版从未在 CDN 生效**（线上 hb.jpg 仍为 2.2MB、c11 仍为 12MB），且网格曾预加载视频 mp4。

## 涉及文件

- `scripts/optimize-dist-images.mjs`（主图 720px + 生成 `.thumb.jpg` 约 420px）
- `src/utils/assetUrl.js`（`coverThumbUrl`、构建版本 `?v=`）
- `src/components/GallerySection.vue`（网格用 thumb、纯视频占位不拉 mp4）
- `vite.config.js`（`__SITE_BUILD_VER__`）

## 行为变化

- 作品集网格只加载 **~15–30KB 缩略图**，点开详情才加载 ~100KB 主图
- 纯视频款式网格**不再下载 mp4**，仅显示 ▶ 占位
- 价目图压缩至 **~110KB**；每次 deploy 图片 URL 带新版本号，绕过 GitHub CDN 旧缓存
- 已成功执行 `npm run deploy` 推送

## 验证方式

1. 打开 https://han201006947.github.io/huahua-nai/?t=4 并强制刷新
2. 价目图应在 1–3 秒内出现；滚到作品集时封面逐张快速加载
3. 点开相册内视频仍可能需等待（视频体积大，属正常）

## Git 提交

- **是否已提交**：是
- **本地 commit**：56bf0b2（master，未 push）
- **提交说明**：perf: 作品集缩略图与图片 CDN 版本号二次加速
