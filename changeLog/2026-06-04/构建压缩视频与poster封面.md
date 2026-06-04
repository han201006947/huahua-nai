# 构建时压缩视频加快顾客加载

## 改动背景

作品集视频原片约 **5～40MB**（如 `m83.mp4` 40MB），顾客点开详情需下载整段 mp4，加载很慢。图片 build 已有 sharp 压缩，视频此前未处理。

## 方案

1. **`scripts/optimize-dist-videos.mjs`**（deploy 时执行）
   - ffmpeg 转 H.264，最长边 720px，CRF 28，`+faststart` 便于边下边播
   - 小于 2.5MB 仅生成封面不重编码
   - 每个视频生成 **`*.poster.jpg`** 首帧封面

2. **前端**
   - 详情 `<video preload="none">` + `poster` 属性，先见封面，点播放再拉 mp4

3. **CI**
   - workflow 安装 `ffmpeg` 后跑 `build:ci`

## 涉及文件

- `scripts/optimize-dist-videos.mjs`
- `package.json`（build / build:ci 增加一步）
- `src/utils/assetUrl.js`（`videoPosterUrl`）
- `src/components/GallerySection.vue`
- `.github/workflows/gallery-sync-deploy.yml`

## 验证

push master → Actions 绿 → 顾客站点开含视频款式：先见封面，播放明显快于改前。

## Git 提交

- **是否已提交**：待回填
- **本地 commit**：待回填
- **提交说明**：待回填
