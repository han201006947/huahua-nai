# Hero 三按钮：最新款式 / 预约 / 作品集

## 改动背景 / 需求

首页 Hero 区原先只有「免费预约体验」「浏览作品集」两个按钮，需增加「最新款式」，点击滚到作品集置顶区。

## 涉及文件

| 文件 | 变化 |
|------|------|
| `src/components/HeroSection.vue` | 三按钮；粉色「最新款式」样式；`goLatest()` |
| `src/components/GallerySection.vue` | `#gallery-latest` 锚点与 scroll-margin |

## 行为变化

- 按钮顺序：**最新款式** → **免费预约体验** → **浏览作品集**
- 点「最新款式」平滑滚到作品集 `#gallery-latest`；暂无新款时落在作品集顶部

## 验证方式

1. 打开首页，确认三个 pill 按钮并排（窄屏可换行）
2. 点「最新款式」应滚到作品集「最新款式」区块或作品集标题附近

## Git 提交

- **是否已提交**：是
- **本地 commit**：fd85530（nail-beauty / master / 未 push）
- **提交说明**：feat: Hero 增加最新款式按钮并跳转作品集置顶
