/**
 * 根据 deploy.config.json 的 publicUrl 生成顾客扫码 PNG（仅 release/顾客扫码二维码.png）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { writeLabeledQr } from './qr-labeled.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const configPath = path.join(projectRoot, 'deploy.config.json')
const examplePath = path.join(projectRoot, 'deploy.config.example.json')
const releaseRoot = path.join(projectRoot, 'release')
const outPath = path.join(releaseRoot, '顾客扫码二维码.png')

function loadDeployConfig() {
  const file = fs.existsSync(configPath) ? configPath : examplePath
  if (!fs.existsSync(file)) return { publicUrl: '' }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const publicUrl = (loadDeployConfig().publicUrl || '').trim()

if (!publicUrl) {
  console.error('请先在 deploy.config.json 填写 publicUrl（部署后的网址）')
  process.exit(1)
}

await writeLabeledQr({
  url: publicUrl,
  title: '【顾客扫码】',
  outPath,
  qrWidth: 480,
})

console.log('>> 顾客扫码图已生成:', outPath)
console.log('>> 链接:', publicUrl)
