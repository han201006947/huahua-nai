# 花花美甲坊 · 美甲宣传站

基于 **Vue 3 + Vite**，电脑与手机自适应。

## 顾客扫码即看（个人 Gitee）

与公司 Git 分开，用个人 Gitee 网页上传 `dist` 即可：

```bash
npm run build          # 生成 dist
# → Gitee 网页上传 dist 内全部文件 → 开启 Pages
npm run gen-qr         # 生成 release/顾客扫码.png
```

**注意：** 个人 Gitee 免费 Pages 已停服，请改用下方「发给顾客」方式。

## 发给顾客 · 点开即看（最简单）

```bash
npm run share          # 自动打开 dist 文件夹 + Netlify 上传页
# → 把 dist 拖进网页 → 复制网址 → 填 deploy.config.json → npm run gen-qr
# → 微信发链接或 release/顾客扫码二维码.png
```

详见 [scripts/share-online.ps1](scripts/share-online.ps1)

## 开发

```bash
cd nail-beauty
npm install
npm run dev
npm run build
```

## 店内临时展示

`npm run package` → **打开网站.bat**，顾客同 WiFi 扫屏幕码。

## 自定义内容

- 文案：`src/data/siteContent.js`
- 作品：`public/` + `npm run sync-gallery`
- 仅看款式：`src/data/galleryAlbums.overrides.js`
