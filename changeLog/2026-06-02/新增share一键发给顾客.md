# 新增 npm run share 一键发给顾客

## 改动背景

Gitee Pages 个人版不可用；用户需把网站发给美甲顾客，点击即可打开网页，要求最简单方式。

## 涉及文件

- `scripts/share-online.ps1`：打开 dist 文件夹 + Netlify Drop 上传页，并打印 3 步说明
- `package.json`：新增 `npm run share`
- `README.md`：补充「发给顾客」说明，注明 Gitee Pages 已停

## 行为变化

执行 `npm run share` 后：

1. 若无 dist 则自动 `npm run build`
2. 打开资源管理器中的 `dist` 文件夹
3. 打开 https://app.netlify.com/drop
4. 用户拖上传后复制网址，填入 `deploy.config.json`，再 `npm run gen-qr`

## 验证方式

```bash
npm run share
```

确认 dist 文件夹与 Netlify 页面同时弹出。

## Git 提交

- **是否已提交**：是
- **本地 commit**：待 commit 后回填
- **提交说明**：fix: 修复 share-online.ps1 PowerShell 中文编码解析错误

## 补充（2026-06-02）

PowerShell 5.1 读取 UTF-8 无 BOM 中文脚本会语法报错，已将 Write-Host 改为英文避免编码问题。

