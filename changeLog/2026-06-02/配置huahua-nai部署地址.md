# 配置 huahua-nai 部署地址

## 改动背景

用户确认 Gitee 仓库为 `https://gitee.com/huahua-nai/huahua-nai`，需配置 Pages 线上地址并生成顾客扫码图。

## 涉及文件

- `deploy.config.example.json`：更新示例仓库与 Pages 地址
- `deploy.config.json`（本地，已 gitignore）：写入实际 `publicUrl`
- `dist/site-url.json`（构建产物）：注入线上永久地址
- `release/顾客扫码二维码.png`（本地生成，已 gitignore）

## 行为变化

- Pages 预期地址：`https://huahua-nai.gitee.io/huahua-nai/`
- 执行 `npm run build` 后会在 `dist/site-url.json` 写入上述地址
- 执行 `npm run gen-qr` 生成 `release/顾客扫码二维码.png`

## 验证方式

1. Gitee 仓库 → **服务** → **Gitee Pages** → 启动
2. 浏览器打开 `https://huahua-nai.gitee.io/huahua-nai/` 应能正常访问
3. 微信扫 `release/顾客扫码二维码.png` 应打开同一网址

## Git 提交

- **是否已提交**：是
- **本地 commit**：e315e1f（master，未 push）
- **提交说明**：chore: 更新 huahua-nai 部署示例地址
