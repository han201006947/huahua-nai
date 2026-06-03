# 修复 Actions gh-pages 推送失败

## 改动背景

PowerShell 修复后 Run #25 仍失败：`Write deploy.config` 与 `npm ci` 均成功，**Build and deploy gh-pages** 约 9 秒退出。本地 `npm run build:ci` 可成功（约 7s），说明 **build 已通过，gh-pages 推送配置不足**。

对比本机 `deploy-github-pages.mjs`：CI 缺少 token 远程 URL、清 `node_modules/.cache/gh-pages`、大体积 `http.postBuffer`，易导致「branch already exists」或认证失败。

## 涉及文件

| 文件 | 变更 |
|------|------|
| `scripts/deploy-gh-pages-ci.mjs` | 新增，Actions 专用 gh-pages 推送 |
| `.github/workflows/gallery-sync-deploy.yml` | 拆分 build/deploy；45 分钟超时 |

## 行为变化

- build 与 deploy 分步，日志更易定位。
- deploy 使用 `x-access-token` + 与本机 deploy 相同 git 缓冲参数。
- 写入 `dist/.nojekyll`。

## 验证方式

push master → Actions **Gallery Sync and Deploy** 全绿 → 2～5 分钟后顾客站见新款。

## Git 提交

- **是否已提交**：待回填
- **本地 commit**：待回填
- **提交说明**：待回填
