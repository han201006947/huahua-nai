# 修复 githubWriteVerify 语法错误

## 背景

Run #32「Build site」约 1 秒失败：`githubWriteVerify.js` 在合并 `verifyCategoryPublicGone` 时误删 `verifyLatestIdsForAlbum` 函数头，导致 PARSE_ERROR，gh-pages 未 deploy 新验证逻辑。

## 修复

恢复 `verifyLatestIdsForAlbum` 完整定义；`npm run build:ci` 本地已通过。

## Git 提交

- **是否已提交**：待回填
- **本地 commit**：待回填
- **提交说明**：待回填
