# 修复 CSS 走 jsDelivr 502 导致整页无样式

## 背景

顾客扫码后页面内容能出来，但**完全没有布局样式**（链接竖排、默认字体），像「纯 HTML」。

## 原因

`scripts/inject-site-url.mjs` 曾把 `index.html` 里的 `style.css`、`app.js` 改成 jsDelivr 地址。实测：

- `https://han201006947.github.io/huahua-nai/assets/style.css` → **200**
- `https://cdn.jsdelivr.net/gh/.../assets/style.css` → **502 Bad Gateway**

JS 有时能 200，Vue 能挂载，但 CSS 加载失败 → 无样式。

## 改动

- **文件**：`scripts/inject-site-url.mjs`
- **行为**：
  - `style.css`、`app.js` **始终**用 `./assets/…`（GitHub Pages 同源）
  - 仍注入 jsDelivr `preconnect` + 价目图 `hb.jpg` preload（大图加速）
  - 作品集/价目等图片继续由 `src/utils/assetUrl.js` 走 jsDelivr

## 验证

1. `npm run build` → 打开 `dist/index.html`，stylesheet 应为 `./assets/style.css?v=…`，不是 cdn.jsdelivr.net
2. `npm run deploy` 后访问 https://han201006947.github.io/huahua-nai/?t=8 应恢复正常排版
3. 作品集缩略图仍从 jsDelivr 加载（体积小、与之前一致）

## Git

- **是否已提交**：否（待 commit）
- **本地 commit**：—
- **提交说明**：—
