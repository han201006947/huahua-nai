/**
 * 根据 deploy.config.json 的 publicUrl 生成「顾客扫码」PNG，可打印或发微信
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const configPath = path.join(projectRoot, 'deploy.config.json')
const examplePath = path.join(projectRoot, 'deploy.config.example.json')
const releaseRoot = path.join(projectRoot, 'release')
const outName = [0x987E, 0x5BA2, 0x626B, 0x7801, 0x4E8C, 0x7EF4, 0x7801].map((c) => String.fromCharCode(c)).join('') + '.png'
const outPath = path.join(releaseRoot, outName)

function loadDeployConfig() {
  const file = fs.existsSync(configPath) ? configPath : examplePath
  if (!fs.existsSync(file)) return { publicUrl: '' }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const publicUrl = (loadDeployConfig().publicUrl || '').trim()

if (!publicUrl) {
  console.error('请先在 deploy.config.json 填写 publicUrl（部署后的网址）')
  console.error('示例：复制 deploy.config.example.json 为 deploy.config.json')
  process.exit(1)
}

if (!fs.existsSync(releaseRoot)) {
  fs.mkdirSync(releaseRoot, { recursive: true })
}

// 生成高清二维码 PNG，便于打印海报
await QRCode.toFile(outPath, publicUrl, {
  width: 480,
  margin: 2,
  color: { dark: '#3d2c2e', light: '#ffffff' },
})

console.log('>> 顾客扫码图已生成:', outPath)
console.log('>> 链接:', publicUrl)
