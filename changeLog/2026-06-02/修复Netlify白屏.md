# 修复 Netlify 部署白屏

## 改动背景

用户 Netlify 上线后页面标题正常但内容空白。根因：`fix-dist-html.ps1` 去掉 `type="module"` 后，`app.js` 仍在 `<head>` 同步执行，此时 `#app` 未渲染，Vue 无法挂载。

## 涉及文件

- `scripts/fix-dist-html.ps1`：去掉 module 后，将 `app.js` 移到 `<div id="app">` 之后

## 行为变化

- 构建后 `dist/index.html` 中脚本位于 `</body>` 前，file://、Netlify 均可正常显示

## 验证方式

1. `npm run build`，确认 `index.html` 中 script 在 `#app` 下方
2. 重新 `npm run share` 上传 Netlify，刷新站点应显示完整页面

## Git 提交

- **是否已提交**：是
- **本地 commit**：8da6f3f（nail-beauty / master / 未 push）
- **提交说明**：fix: 修复 Netlify 白屏，app.js 移至 body 末尾
