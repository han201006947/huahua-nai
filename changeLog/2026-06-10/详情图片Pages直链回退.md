# 详情图片加载回退 Pages 直链

## 改动背景

主题款 3 详情弹层图片 CDN 失败时裂图，顾客端原先无回退。

## 改动

- `GallerySection.vue`：`onMediaImgError` 增加 `pagesAssetUrl` 直链回退

## Git 提交

- **是否已提交**：是
- **本地 commit**：0c0f5d7（nail-beauty / master，已 push）
- **提交说明**：fix: 详情图片失败回退 Pages 直链
