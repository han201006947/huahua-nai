/**
 * 生成店主管理登录二维码（链接含密钥，仅店主保存此图）
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import QRCode from 'qrcode'
import { fileURLToPath } from 'url'
import { buildAdminLoginUrl, loadAdminConfig } from './admin-auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const releaseDir = path.join(projectRoot, 'release')

// 探测本机局域网 IPv4，供手机微信扫码（localhost 在手机上无效）
function detectLanOrigin() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:5173`
      }
    }
  }
  return 'http://localhost:5173'
}

// 管理 API 仅在 npm run dev 生效；无参数时自动用局域网 IP
function resolveOrigin() {
  if (process.argv[2]) return process.argv[2].replace(/\/$/, '')
  return detectLanOrigin()
}

async function main() {
  const cfg = loadAdminConfig()
  const origin = resolveOrigin()
  const loginUrl = buildAdminLoginUrl(origin)
  if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true })
  const outPng = path.join(releaseDir, '店主管理登录二维码.png')
  const outTxt = path.join(releaseDir, '店主管理登录链接.txt')
  await QRCode.toFile(outPng, loginUrl, { width: 320, margin: 2 })
  fs.writeFileSync(outTxt, `${loginUrl}\n`, 'utf8')
  console.log('>> 店主手机号:', cfg.adminPhone)
  console.log('>> 登录链接:', loginUrl)
  console.log('>> 已生成:', outPng)
  console.log('>> 链接文本:', outTxt)
  console.log('>> 须先运行 npm run dev（已开启局域网 host）')
  console.log('>> 手机须与电脑同一 WiFi，勿用 localhost 扫码')
  if (origin.includes('localhost')) {
    console.log('>> 警告：未检测到局域网 IP，请手动指定：')
    console.log('>>   npm run gen-admin-qr http://192.168.x.x:5173')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
