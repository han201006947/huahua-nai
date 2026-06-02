# 改用 GitHub Pages 替代 Netlify

## 改动背景

Netlify 注册人机验证无法显示；用户要求更简单的公网扫码方案。GitHub Pages 免费、支持 272MB 含视频，网页上传即可。

## 涉及文件

- `scripts/online-github.ps1` + `online-github-steps.txt`：构建并打开中文步骤、dist、GitHub 新建页
- `scripts/deploy-github-pages.mjs`：可选命令行 gh-pages 部署
- `package.json`：`online`/`share` 改 GitHub，新增 `deploy`
- 删除 `online-netlify.ps1`

## 行为变化

- `npm run online` → 记事本 7 步 GitHub Pages，无需 Netlify 验证码
- `npm run deploy` → 配好 githubRepoUrl 后一键推送（可选）

## 验证方式

```bash
npm run online
```

确认弹出 dist、GitHub 新建页、release/online-github-steps.txt 记事本。

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—
