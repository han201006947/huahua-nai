/**
 * 全国扫码：本地站点 + localtunnel 公网链接 + 自动生成二维码（免费、不限上传体积）
 */
import { spawn, execSync } from 'child_process'
import fs from 'fs'
import net from 'net'
import path from 'path'
import { fileURLToPath } from 'url'
import localtunnel from 'localtunnel'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const resourcesDir = path.join(__dirname, 'package-resources')
const releaseDir = path.join(projectRoot, 'release')
const liveDir = path.join(releaseDir, 'public-live')
const configPath = path.join(projectRoot, 'deploy.config.json')
const port = 8765

// 检测本地端口是否已监听
function waitForPort(p, timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(p, '127.0.0.1', () => {
        sock.end()
        resolve()
      })
      sock.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`port ${p} not ready`))
        else setTimeout(tryOnce, 500)
      })
    }
    tryOnce()
  })
}

// 若无 dist 则先构建
function ensureDist() {
  if (fs.existsSync(path.join(distDir, 'index.html'))) return
  console.log('>> npm run build')
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
}

// 准备 public-live 目录（dist + serve.py + 扫码页）
function prepareLiveDir() {
  if (fs.existsSync(liveDir)) {
    try {
      fs.rmSync(liveDir, { recursive: true, force: true })
    } catch {
      // 上次 Python 仍占用目录时，直接覆盖 dist 即可
      console.log('>> reuse public-live (folder in use)')
    }
  }
  if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true })
  const liveDist = path.join(liveDir, 'dist')
  if (fs.existsSync(liveDist)) fs.rmSync(liveDist, { recursive: true, force: true })
  fs.cpSync(distDir, liveDist, { recursive: true })
  for (const name of ['serve.py', 'scan.html', 'qrcode.min.js']) {
    fs.copyFileSync(path.join(resourcesDir, name), path.join(liveDir, name))
  }
}

// 启动 Python 本地静态服务
function startPythonServer() {
  const py = process.platform === 'win32' ? 'py' : 'python3'
  const child = spawn(py, ['serve.py'], {
    cwd: liveDir,
    stdio: 'ignore',
    detached: true,
    shell: true,
  })
  child.unref()
  return child
}

// 写入 deploy.config.json 公网地址
function savePublicUrl(url) {
  let cfg = { publicUrl: url, githubRepoUrl: 'https://github.com/han201006947/huahua-nai.git' }
  if (fs.existsSync(configPath)) {
    try {
      const old = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      if (old.githubRepoUrl) cfg.githubRepoUrl = old.githubRepoUrl
    } catch {}
  }
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8')
}

// 主流程
ensureDist()
prepareLiveDir()

console.log('>> start local server on port', port)
startPythonServer()
await waitForPort(port)

console.log('>> start public tunnel (may take 10-30s) ...')
const tunnel = await localtunnel({ port })
const publicUrl = tunnel.url.endsWith('/') ? tunnel.url : `${tunnel.url}/`

savePublicUrl(publicUrl)
execSync('npm run gen-qr', { cwd: projectRoot, stdio: 'inherit' })

const qrName = '顾客扫码二维码.png'
const qrPath = path.join(releaseDir, qrName)

console.log('')
console.log('============================================')
console.log(' 全国扫码已就绪（含全部视频）')
console.log('============================================')
console.log('  链接:', publicUrl)
console.log('  二维码:', qrPath)
console.log('')
console.log('  微信发二维码图，全国顾客可扫（不用同一 WiFi）')
console.log('  请保持本窗口不要关闭，关了就打不开')
console.log('  下次运行 npm run public 链接会变')
console.log('  以后要固定链接：GitHub 通时 npm run deploy')
console.log('============================================')

tunnel.on('close', () => {
  console.log('>> tunnel closed')
  process.exit(0)
})

process.on('SIGINT', () => {
  tunnel.close()
  process.exit(0)
})

// 保持进程，维持隧道
await new Promise(() => {})
