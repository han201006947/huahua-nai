/**
 * GitHub Actions 专用：将 dist 推到 gh-pages（token 认证 + 大体积缓冲 + 清缓存）
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 项目根与 dist 目录
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectRoot, 'dist')
// gh-pages 本地缓存目录，残留会导致「branch gh-pages already exists」
const cacheDir = path.join(projectRoot, 'node_modules/.cache/gh-pages')

// 必须先 build 成功
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('>> dist/index.html 不存在，请先 npm run build:ci')
  process.exit(1)
}

// 禁用 Jekyll，避免 _ 开头资源被 GitHub Pages 忽略
const nojekyllPath = path.join(distDir, '.nojekyll')
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '')
}

// Actions 注入的环境变量
const token = (process.env.GITHUB_TOKEN || '').trim()
const repo = (process.env.GITHUB_REPOSITORY || '').trim()
if (!token || !repo.includes('/')) {
  console.error('>> 需要 GITHUB_TOKEN 与 GITHUB_REPOSITORY 环境变量')
  process.exit(1)
}

// 清除 gh-pages 插件缓存，避免 orphan 推送冲突
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true })
  console.log('>> 已清除 gh-pages 缓存')
}

// 带 token 的 HTTPS 远程，Actions 默认可写 contents
const repoUrl = `https://x-access-token:${token}@github.com/${repo}.git`

// 大体积静态站：增大 HTTP 缓冲、固定 HTTP/1.1（与 deploy-github-pages.mjs 一致）
const deployEnv = {
  ...process.env,
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'http.postBuffer',
  GIT_CONFIG_VALUE_0: '524288000',
  GIT_CONFIG_KEY_1: 'http.version',
  GIT_CONFIG_VALUE_1: 'HTTP/1.1',
}

console.log('>> 推送到 gh-pages 分支（约 270MB，请耐心等待）...')
execSync(`npx gh-pages -d dist -f -r "${repoUrl}"`, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: deployEnv,
})
console.log('>> gh-pages deploy 完成')
