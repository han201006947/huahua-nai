# 店主增删款式 Git 写入验证

## 改动背景

店主手机删除款式时，界面先乐观移除，但 GitHub 上 public 图片可能未删成功，导致 `galleryAlbums.js` 已更新而图片仍在仓库。用户要求增删必须确认 Git 成功后再更新列表。

## 涉及文件

| 文件 | 变更 |
|------|------|
| `src/utils/githubWriteVerify.js` | 新增：轮询验证 public 路径、galleryAlbums、revision |
| `src/utils/githubContents.js` | 新增 `repoPathExists` |
| `src/composables/githubGalleryAdmin.js` | 先删 public 并验证，再写列表；添加后验证文件存在 |
| `src/components/GallerySection.vue` | 删除取消乐观更新，成功后才刷新网格 |
| `src/components/GalleryAdminPanel.vue` | 提示文案与验证中状态 |

## 行为变化

- **删除**：先删 public 内文件 → 验证目录无该款式 → 再写 overrides / galleryAlbums / revision → 回读验证列表与 latestIds。
- **添加**：上传每个文件 → 验证路径存在 → 写列表与 revision → 回读验证。
- 任一步验证失败抛中文错误，**界面保持原列表**，不会「看起来删了其实没删」。

## 验证方式

1. 店主登录 → 删除一款 → 处理中按钮转圈，成功后款式消失；若 Git 失败会弹窗且款式仍在。
2. GitHub 仓库 `public/` 与 `galleryAlbums.js` 应与界面一致。
3. 添加款式后同样需等「GitHub 图片与列表已确认」提示。

## Git 提交

- **是否已提交**：待回填
- **本地 commit**：待回填
- **提交说明**：待回填
