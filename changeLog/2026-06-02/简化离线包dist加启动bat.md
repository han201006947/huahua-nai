# 简化离线包 dist + 启动.bat

## 改动背景

Netlify 等上传方式对用户太复杂；改为最简方案：只要 `dist` 和双击运行文件，店内 WiFi 扫码看款式（含视频）。

## 涉及文件

- `scripts/package-offline.ps1`：精简为 dist + 启动.bat + 扫码辅助文件，打包后自动打开文件夹
- `scripts/package-resources/start.bat`：单一启动入口（原 open-site/open-direct 合并）
- `scripts/package-resources/usage.txt`：三行说明
- `package.json`：新增 `npm run out`
- `README.md`：以 `npm run out` 为主说明

## 行为变化

- `npm run out` / `npm run package` → `release/花花美甲坊/` 与同名 zip
- 目录内：`dist/`、`启动.bat`、`说明.txt` 及必要运行脚本
- 双击启动.bat → 本地服务 + 扫码页，顾客同 WiFi 可看含视频完整站

## 验证方式

```bash
npm run out
```

双击 `release/花花美甲坊/启动.bat`，手机同 WiFi 访问扫码页。

## Git 提交

- **是否已提交**：是
- **本地 commit**：8d710e7（nail-beauty / master / 未 push）
- **提交说明**：feat: npm run out 生成 dist 与启动.bat 离线包
