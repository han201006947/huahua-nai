/**
 * 构建后写入 dist/site-url.json，并在 index.html 注入 jsDelivr 预连接与价目图 preload
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const configPath = path.join(projectRoot, 'deploy.config.json')
const examplePath = path.join(projectRoot, 'deploy.config.example.json')
const distMeta = path.join(projectRoot, 'dist', 'site-url.json')
const indexPath = path.join(projectRoot, 'dist', 'index.html')

function loadDeployConfig() {
  const file = fs.existsSync(configPath) ? configPath : examplePath
  if (!fs.existsSync(file)) return { publicUrl: '' }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// 由 GitHub 仓库地址推导 jsDelivr gh-pages 根路径
function resolveCdnBase(cfg) {
  const m = (cfg.githubRepoUrl || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
  if (!m) return ''
  return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@gh-pages`
}

// 在 index.html 注入 CDN 预连接与价目图 preload，加快首屏
function patchIndexHtml(cdnBase) {
  if (!cdnBase || !fs.existsSync(indexPath)) return
  let html = fs.readFileSync(indexPath, 'utf8')

  const verMatch = html.match(/app\.js\?v=(\d+)/)
  const ver = verMatch ? verMatch[1] : ''
  const heroHref = `${cdnBase}/hb.jpg${ver ? `?v=${ver}` : ''}`

  if (!html.includes('rel="preload" as="image"')) {
    const hints = [
      '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
      '<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">',
      `<link rel="preload" as="image" href="${heroHref}">`,
    ].join('\n    ')
    html = html.replace('</head>', `    ${hints}\n  </head>`)
  }

  // 脚本与样式走 jsDelivr（国内比 github.io 快）
  if (!html.includes(`${cdnBase}/assets/app.js`)) {
    html = html.replace(
      /href="\.\/assets\/style\.css(?:\?v=(\d+))?"/,
      (_, v) => `href="${cdnBase}/assets/style.css${v ? `?v=${v}` : ver ? `?v=${ver}` : ''}"`
    )
    html = html.replace(
      /src="\.\/assets\/app\.js\?v=(\d+)"/,
      `src="${cdnBase}/assets/app.js?v=$1"`
    )
    console.log('>> 已将 app.js / style.css 切换为 jsDelivr')
  }

  fs.writeFileSync(indexPath, html, 'utf8')
  if (!html.includes('cdn.jsdelivr.net')) return
  console.log('>> 已注入 jsDelivr 预连接与价目图 preload')
}

const cfg = loadDeployConfig()
const publicUrl = (cfg.publicUrl || '').trim()

if (!publicUrl) {
  if (fs.existsSync(distMeta)) fs.unlinkSync(distMeta)
  console.log('>> 未配置 publicUrl，跳过 site-url.json（顾客需用店内 WiFi 扫码）')
  process.exit(0)
}

const cdnBase = resolveCdnBase(cfg)
const payload = { publicUrl, mode: 'online', cdnBase }
fs.writeFileSync(distMeta, JSON.stringify(payload, null, 2), 'utf8')
console.log('>> 已写入 dist/site-url.json:', publicUrl)
if (cdnBase) console.log('>> CDN:', cdnBase)

patchIndexHtml(cdnBase)
