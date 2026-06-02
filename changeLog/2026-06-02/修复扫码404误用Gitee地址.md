# 修复扫码 404（误用失效 Gitee 地址）

## 改动背景

用户扫码后出现 404。扫码页优先读取 `dist/site-url.json` 里的 Gitee Pages 地址，该服务已停，顾客扫到无效链接。

## 涉及文件

- `scripts/package-resources/scan.html`：优先 `lan.json` 局域网地址，再回退线上地址
- `scripts/package-offline.ps1`：打包时删除 `dist/site-url.json`

## 行为变化

- 店内双击启动.bat，二维码指向 `http://192.168.x.x:8765/`（同 WiFi）
- 不再误跳 Gitee 404

## 验证方式

`npm run out` → 启动.bat → 扫码页二维码应为局域网 IP 而非 gitee.io

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—
