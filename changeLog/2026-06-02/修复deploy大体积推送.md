# 修复 npm run deploy 大体积推送

## 改动背景

用户执行 `npm run deploy` 时先后遇到：

1. `fatal: a branch named 'gh-pages' already exists`（gh-pages 本地缓存冲突）
2. `curl 55 Send failure: Connection was reset`（约 270MB dist 推送中断）
3. 偶发 `Failed to connect to github.com port 443`（本机网络无法访问 GitHub）

## 涉及文件

- `scripts/deploy-github-pages.mjs`

## 行为变化

- 部署前自动删除 `node_modules/.cache/gh-pages`，避免分支已存在报错
- 通过 `GIT_CONFIG_*` 临时增大 `http.postBuffer`、使用 `HTTP/1.1`，不修改全局 git 配置
- 使用 `gh-pages -f`（`--no-history`）每次强制推送全新提交，适合大体积静态站
- 控制台提示 dist 约 270MB，首次上传需耐心等待

## 验证方式

1. 确保本机能打开 https://github.com（国内可能需要代理/VPN）
2. 在 GitHub 创建 **Tokens (classic)**，勾选 **repo**
3. 项目目录执行 `npm run deploy`
   - Username：`han201006947`
   - Password：Token（不是登录密码）
4. 仓库 **Settings → Pages** → Branch **`gh-pages`** → `/ (root)` → Save
5. 访问 https://han201006947.github.io/huahua-nai/
6. `npm run gen-qr` 生成顾客二维码

## Git 提交

- **是否已提交**：是
- **本地 commit**：13fe371（master，未 push）
- **提交说明**：fix: deploy 清缓存并优化 270MB GitHub 推送
