# 同步 GitHub 与更新二维码

## 改动背景

用户要求将本地改动同步到 GitHub，并更新顾客/店主扫码二维码。

## 执行内容

1. **合并远程 master**：手机端已同步的主题款 z3/z4/z5 等提交已与本地「扫码首屏加速」等 commit 合并。
2. **推送 master**：`157f6f0..8fa413b` 已成功推送到 `origin/master`。
3. **本地构建**：`npm run build` 成功（含新款 z4/z5 图片压缩）。
4. **gh-pages 部署**：本地 `npm run deploy` 因 GitHub 443 连接超时/中断失败（408 / connection reset）。**GitHub Actions**（`gallery-sync-deploy.yml`）应在 master 推送后自动构建并部署 gh-pages。
5. **二维码**：已按 `deploy.config.json` 的 `publicUrl` 重新生成：
   - `release/顾客扫码二维码.png`
   - `release/店主扫码-管理款式.png`
   - `release/店主管理登录链接.txt`

## 线上地址

https://han201006947.github.io/huahua-nai/

## 验证方式

1. GitHub 仓库 Actions 页查看 `Gallery Sync and Deploy` 是否绿勾。
2. 数分钟后刷新线上站点，确认主题款 z3/z4/z5 与删除 c5 后内容一致。
3. 打开 `release/顾客扫码二维码.png` 扫码应进入上述网址。

## 备注

- 清理了残留 `public/zhuti/Z3/z35.mp4`（权限异常导致构建失败）。
- 若 Actions 未触发，网络恢复后可再执行 `npm run deploy`。

## Git 提交

- **是否已提交**：是
- **本地 commit**：3166984（nail-beauty / master，未 push）
- **提交说明**：docs: 记录 GitHub 同步与二维码更新
