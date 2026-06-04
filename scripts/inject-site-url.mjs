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

// 扫码后立即显示品牌提示，避免白屏（Vue 挂载后会被替换）
function injectBootSplash(html) {
  if (html.includes('id="boot-splash"')) return html
  const splash =
    '<div id="boot-splash" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#faf6f1;color:#5c4033;font-family:system-ui,-apple-system,sans-serif">' +
    '<p style="font-size:1.2rem;margin:0 0 8px;font-weight:600">花花美甲坊</p>' +
    '<p style="font-size:0.85rem;margin:0;opacity:0.65">正在打开，请稍候…</p></div>'
  return html.replace('<div id="app"></div>', `<div id="app">${splash}</div>`)
}

// 在 index.html 注入预连接与 CSS/JS preload（价目图由 img fetchpriority 拉取，避免与脚本抢带宽）
function patchIndexHtml(cdnBase) {
  if (!fs.existsSync(indexPath)) return
  let html = fs.readFileSync(indexPath, 'utf8')
  html = injectBootSplash(html)

  const cssMatch = html.match(/href="\.\/assets\/style\.css\?v=[^"]+"/)
  const jsMatch = html.match(/src="\.\/assets\/app\.js\?v=[^"]+"/)
  const hints = []

  if (!html.includes('dns-prefetch" href="https://github.io"')) {
    hints.push('<link rel="dns-prefetch" href="https://github.io">')
    hints.push('<link rel="preconnect" href="https://github.io" crossorigin>')
  }
  if (cssMatch && !html.includes('rel="preload" as="style"')) {
    hints.push(`<link rel="preload" as="style" href="${cssMatch[0].slice(6, -1)}">`)
  }
  if (jsMatch && !html.includes('rel="preload" as="script"')) {
    hints.push(`<link rel="preload" as="script" href="${jsMatch[0].slice(5, -1)}">`)
  }
  if (cdnBase && !html.includes('dns-prefetch" href="https://cdn.jsdelivr.net"')) {
    hints.push('<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">')
  }

  if (hints.length) {
    html = html.replace('</head>', `    ${hints.join('\n    ')}\n  </head>`)
  }

  fs.writeFileSync(indexPath, html, 'utf8')
  if (hints.length) console.log('>> 已注入 Pages 预连接与 CSS/JS preload（价目图不再 link-preload）')
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
