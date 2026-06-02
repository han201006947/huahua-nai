# 花花美甲坊 · 美甲宣传站

Vue 3 + Vite，电脑与手机自适应。

## 网上扫码 · 任何人都能看（不用同一 WiFi）

```bash
npm run online
```

1. 自动构建并打开 **dist 文件夹** + [Netlify 官网](https://app.netlify.com/)
2. 免费注册 / 登录
3. **Sites** → **Add new site** → **Deploy manually**
4. 把 **dist 里面的全部文件**拖进去（`index.html`、`assets/`、`maoyan/` 等，不是拖 dist 文件夹本身）
5. 复制网址，例如 `https://huahua-nail.netlify.app/`
6. 写入 `deploy.config.json`：

```json
{
  "publicUrl": "https://huahua-nail.netlify.app/"
}
```

7. 生成二维码：

```bash
npm run gen-qr
```

使用 **`release/顾客扫码二维码.png`**，微信发送或打印，**全国顾客扫码即可看**（含视频）。

以后更新作品：重新 `npm run build`，在 Netlify 该站点 **Deploys** 里再拖一次 dist 内文件，链接不变。

> Netlify 免费、长期有效，272MB 含视频可上传。Gitee 个人 Pages / upma 10MB 上限不适用。

## 店内 WiFi 扫码（仅同网络）

```bash
npm run out
```

生成 **`release/花花美甲坊/`**，双击 **启动.bat**，顾客连店里同一 WiFi 扫码。详见文件夹内 **说明.txt**。

## 开发

```bash
npm install
npm run dev
npm run build
```

## 自定义

- 文案：`src/data/siteContent.js`
- 作品图/视频：`public/` 后 `npm run build` 或 `npm run online`
- 仅看部分款式：`src/data/galleryAlbums.overrides.js`
