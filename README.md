# 花花美甲坊 · 美甲宣传站

Vue 3 + Vite，电脑与手机自适应。

## 全国扫码 · 现在就能用（推荐）

```bash
npm run public
```

- **免费、不限文件大小**（含全部视频）
- 自动生成公网链接 + **`release/顾客扫码二维码.png`**
- 全国顾客可扫，**不用同一 WiFi**
- ⚠️ **保持命令行窗口不要关**（关了链接失效）
- ⚠️ 每次运行链接会变；要**固定链接**等 GitHub 通时用 `npm run deploy`

## 网上扫码 · 固定长期链接（GitHub Pages）

```bash
npm run online
```

会自动：**构建** → 打开 **dist 文件夹** → 打开 **GitHub 新建仓库页** → 打开**中文步骤记事本**。

按记事本 **7 步**做完即可（比 Netlify 注册简单，272MB 含视频可用）：

1. GitHub 注册  
2. 新建公开仓库 `huahua-nail`  
3. **Upload files** 上传 dist 里全部文件  
4. **Settings → Pages** → Branch 选 `main` → Save  
5. 得到 `https://用户名.github.io/huahua-nail/`  
6. 填入 `deploy.config.json` 的 `publicUrl`  
7. `npm run gen-qr` → 用 `release/顾客扫码二维码.png`

## 店内 WiFi 扫码（仅同网络）

```bash
npm run out
```

双击 **启动.bat**，顾客连店里同一 WiFi 扫码。

## 开发

```bash
npm install
npm run dev
npm run build
```

## 可选 · 命令行部署 GitHub

已熟悉 GitHub Token 时：`deploy.config.json` 填 `githubRepoUrl` 后执行 `npm run deploy`。

## 自定义

- 文案：`src/data/siteContent.js`
- 作品：`public/` 后 `npm run build` 或 `npm run online`
