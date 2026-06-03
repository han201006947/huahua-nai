/**
 * 构建后处理 dist/index.html：去掉 module 属性、defer 加载 app.js（与 fix-dist-html.ps1 等价，供 Linux CI 使用）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 项目根目录
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Vite 输出的入口 HTML
const indexPath = path.join(projectRoot, 'dist', 'index.html')

// 无 dist 时直接报错，避免静默跳过导致线上白屏
if (!fs.existsSync(indexPath)) {
  console.error('>> dist/index.html 不存在，请先 vite build')
  process.exit(1)
}

// 读取 Vite 生成的 HTML
let html = fs.readFileSync(indexPath, 'utf8')
// 去掉 type="module"，便于 file:// 与旧 WebView 直接打开
html = html.replace(/\s*type="module"/g, '')
// 去掉 crossorigin，避免部分环境加载异常
html = html.replace(/\s*crossorigin/g, '')

// 版本号追加到静态资源 URL，减轻 CDN/浏览器长期缓存旧包
const buildVer = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
const cssHref = `./assets/style.css?v=${buildVer}`
const jsSrc = `./assets/app.js?v=${buildVer}`

// 统一 CSS 带版本 query
html = html.replace(/href="\.\/assets\/style\.css(?:\?v=[^"]*)?"/, `href="${cssHref}"`)

// 移除 Vite 内联的 app.js script，稍后以 defer 形式插入
const scriptPattern = /<script\s+[^>]*src="\.\/assets\/app\.js[^"]*"[^>]*>\s*<\/script>/g
html = html.replace(scriptPattern, '')

// 在 #app 后插入 defer 脚本，不阻塞首屏解析
const scriptTag = `<script defer src="${jsSrc}"></script>`
html = html.replace(
  '<div id="app"></div>',
  `<div id="app"></div>\n    ${scriptTag}`
)

// 无 BOM 写入，与 PowerShell 版行为一致
fs.writeFileSync(indexPath, html, 'utf8')
console.log(`>> fixed dist/index.html: defer app.js v=${buildVer}`)
