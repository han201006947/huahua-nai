/**
 * 根据 deploy.config.json 的 publicUrl 生成「顾客扫码」PNG，可打印或发微信
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
// 主文件名：一眼区分用途
const outPrimary = path.join(releaseRoot, '顾客扫码-只看作品集.png')
// 兼容旧文档中的文件名
const outLegacy = path.join(releaseRoot, '顾客扫码二维码.png')

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

const qrOpts = {
  url: publicUrl,
  title: '【顾客扫码】',
  subtitle: '只看作品集 · 可发给客人',
  qrWidth: 480,
}

await writeLabeledQr({ ...qrOpts, outPath: outPrimary })
fs.copyFileSync(outPrimary, outLegacy)

console.log('>> 顾客扫码图已生成:', outPrimary)
console.log('>> 兼容副本:', outLegacy)
console.log('>> 链接:', publicUrl)
