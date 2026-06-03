# 修复 GitHub Actions 构建失败

## 改动背景

`Gallery Sync and Deploy` 工作流在 **Build and deploy gh-pages** 步骤连续失败（约 4 秒即退出）。前面 checkout、npm ci、sync-gallery、push 均成功，失败点在 `npm run build`。

根因：`package.json` 的 `build` 脚本在 Vite 构建后调用 **Windows PowerShell** 执行 `scripts/fix-dist-html.ps1`，而 Actions 运行在 **ubuntu-latest**，无 `powershell` 命令，导致构建中断，`gh-pages` 未更新，顾客站看不到 C5/C6/C7 与「最新款式」区块。

## 涉及文件

| 文件 | 变更 |
|------|------|
| `scripts/fix-dist-html.mjs` | 新增，与 ps1 等价的跨平台 HTML 后处理 |
| `scripts/write-deploy-config-ci.mjs` | 新增，CI 从 `GITHUB_REPOSITORY` 写入 `deploy.config.json` |
| `package.json` | `build` 改走 `.mjs`；新增 `build:ci`（跳过重复 sync-gallery） |
| `.github/workflows/gallery-sync-deploy.yml` | 构建前写 deploy 配置；使用 `build:ci` |

## 行为变化

- 本地 `npm run build` 仍完整跑 sync-gallery + vite + 优化 + fix-html + inject。
- Actions 在 sync 提交后执行 `write-deploy-config-ci.mjs`，再 `npm run build:ci`，最后 `gh-pages -d dist -f`。
- `deploy.config.json` 仍 gitignore；CI 临时生成，注入正确的 `publicUrl` 与 `__GITHUB_REPO__`。

## 验证方式

1. push 到 `master` 后打开 Actions，确认 **Gallery Sync and Deploy** 全绿。
2. 等待 2～5 分钟，访问 https://han201006947.github.io/huahua-nai/
3. 美甲服务下方应出现「最新款式」及 c7/c6/c5；作品集 lazy 加载后 C5/C6 相册正常。

## Git 提交

- **是否已提交**：待回填
- **本地 commit**：待回填
- **提交说明**：待回填
