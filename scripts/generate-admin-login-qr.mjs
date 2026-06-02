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

// 跳过虚拟网卡/热点/链路本地，避免二维码指向手机扫不开的地址
function isBadInterface(name, address) {
  const n = String(name || '').toLowerCase()
  if (n.includes('vmware') || n.includes('virtualbox') || n.includes('vethernet')) return true
  if (n.includes('hotspot') || n.includes('mobile') || address.startsWith('192.168.137.')) return true
  if (address.startsWith('169.254.')) return true
  return false
}

// 探测本机局域网 IPv4：优先 WLAN/Wi-Fi，供手机微信扫码
function detectLanOrigin() {
  const ifaces = os.networkInterfaces()
  const candidates = []
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (isBadInterface(name, iface.address)) continue
      candidates.push({ name, address: iface.address })
    }
  }
  const prefer = (re) => candidates.find((c) => re.test(c.name))
  const picked =
    prefer(/wlan|wi-?fi|无线/i) ||
    prefer(/ethernet|以太网/i) ||
    candidates[0]
  if (picked) return `http://${picked.address}:5173`
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
  console.log('>> 使用地址:', origin)
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
