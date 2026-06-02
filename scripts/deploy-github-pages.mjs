/**
 * 一键推到 GitHub Pages（需 deploy.config.json 里填好 githubRepoUrl）
 * 首次需在 GitHub 创建空仓库，并用 Personal Access Token 作为 git 密码
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const configPath = path.join(projectRoot, 'deploy.config.json')
const examplePath = path.join(projectRoot, 'deploy.config.example.json')
const distDir = path.join(projectRoot, 'dist')

function loadDeployConfig() {
  const file = fs.existsSync(configPath) ? configPath : examplePath
  if (!fs.existsSync(file)) return {}
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const cfg = loadDeployConfig()
const repoUrl = (cfg.githubRepoUrl || '').trim()

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('>> 请先 npm run build')
  process.exit(1)
}

if (!repoUrl) {
  console.error('>> 请在 deploy.config.json 填写 githubRepoUrl')
  console.error('>> 示例：https://github.com/你的用户名/huahua-nail.git')
  process.exit(1)
}

// 清除 gh-pages 本地缓存，避免 "branch gh-pages already exists" 报错
const cacheDir = path.join(projectRoot, 'node_modules/.cache/gh-pages')
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true })
  console.log('>> 已清除 gh-pages 缓存')
}

console.log('>> 推送到 GitHub Pages 分支 gh-pages ...')
console.log('>> 仓库:', repoUrl)
console.log('>> 若提示登录：用户名填 GitHub 用户名，密码填 Personal Access Token（不是登录密码）')
console.log('>> dist 约 270MB，首次上传可能需数分钟，请勿关闭窗口')

// 大体积推送：增大 HTTP 缓冲、用 HTTP/1.1；`-f` 每次 orphan 提交避免历史膨胀
const deployEnv = {
  ...process.env,
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'http.postBuffer',
  GIT_CONFIG_VALUE_0: '524288000',
  GIT_CONFIG_KEY_1: 'http.version',
  GIT_CONFIG_VALUE_1: 'HTTP/1.1',
}

execSync(`npx gh-pages -d dist -r ${repoUrl} -f`, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: deployEnv,
})

const m = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
if (m) {
  const pagesUrl = `https://${m[1]}.github.io/${m[2]}/`
  console.log('')
  console.log('>> 推送完成。请到 GitHub 仓库 Settings → Pages')
  console.log('>> 选 Branch: gh-pages  /  (root)，保存后访问：')
  console.log('>>', pagesUrl)
  console.log('>> 填入 deploy.config.json 的 publicUrl 后执行 npm run gen-qr')
}
