# 网上扫码 npm run online

## 改动背景

用户希望二维码分享给网上其他人，不必同一 WiFi。新增 Netlify 免费永久部署引导与顾客扫码图流程。

## 涉及文件

- `scripts/online-netlify.ps1`：构建、打开 dist 与 Netlify，打印 7 步说明
- `package.json`：新增 `npm run online`，`share` 同指向该脚本
- `deploy.config.example.json`：示例改为 Netlify 地址
- `README.md`：网上扫码作为主流程说明

## 行为变化

- `npm run online` → 构建 → 手动上传 Netlify → 填 `deploy.config.json` → `npm run gen-qr`
- 生成的 `release/顾客扫码二维码.png` 指向公网 URL，任何人可扫

## 验证方式

```bash
npm run online
# 部署后填 publicUrl，再 npm run gen-qr，手机用流量扫码应能打开
```

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—
