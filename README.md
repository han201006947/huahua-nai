# 花花美甲坊 · 美甲宣传站

Vue 3 + Vite，电脑与手机自适应。

## 最简单 · 店里有 WiFi 就能看（推荐）

```bash
npm run out
```

生成 **`release/花花美甲坊/`**：

| 内容 | 作用 |
|------|------|
| `dist/` | 网站（含全部视频） |
| `启动.bat` | **双击即可** |
| `serve-dist.ps1` | 本地小服务（不用管） |
| `scan.html` + `qrcode.min.js` | 扫码页（不用管） |
| `说明.txt` | 三行说明 |

**用法：** 把整个文件夹拷到店里电脑 → 双击 **启动.bat** → 顾客连同一 WiFi 扫屏幕二维码。

同目录还有 **`花花美甲坊.zip`**，可微信发给另一台电脑解压使用。

## 开发

```bash
npm install
npm run dev
npm run build
```

## 自定义

- 文案：`src/data/siteContent.js`
- 作品图/视频：`public/` 后执行 `npm run build` 或 `npm run out`
- 仅看部分款式：`src/data/galleryAlbums.overrides.js`

## 其他（可选）

- `npm run gen-qr`：有公网地址时生成顾客扫码图（需先填 `deploy.config.json`）
- `npm run share`：打包 zip 上传 Netlify 等（较麻烦，一般不必）
