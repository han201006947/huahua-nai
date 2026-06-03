/**
 * 生成店主管理登录二维码（与顾客同链接 + 登录参数，手机扫码即可管理）
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildAdminLoginUrl, loadAdminConfig } from './admin-auth.mjs'
import { writeLabeledQr } from './qr-labeled.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const releaseDir = path.join(projectRoot, 'release')
const deployConfigPath = path.join(projectRoot, 'deploy.config.json')

// 读取线上 publicUrl 或局域网 dev 地址
function loadPublicUrl() {
  if (process.argv[2]) return process.argv[2].replace(/\/$/, '')
  if (fs.existsSync(deployConfigPath)) {
    const cfg = JSON.parse(fs.readFileSync(deployConfigPath, 'utf8'))
    const url = (cfg.publicUrl || '').trim().replace(/\/$/, '')
    if (url) return url
  }
  return detectLanOrigin()
}

// 优先 WLAN 网卡 IP（避免扫到热点/虚拟机地址）
function detectLanOrigin() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    if (!/wlan|wi-?fi|无线/i.test(name)) continue
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:5173`
      }
    }
  }
  return 'http://localhost:5173'
}

async function main() {
  const cfg = loadAdminConfig()
  const origin = loadPublicUrl()
  const loginUrl = buildAdminLoginUrl(origin)
  if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true })
  const outPng = path.join(releaseDir, '店主扫码-管理款式.png')
  const outTxt = path.join(releaseDir, '店主管理登录链接.txt')

  await writeLabeledQr({
    url: loginUrl,
    title: '【店主扫码】',
    subtitle: '管理款式 · 仅店主保存 · 勿发客人',
    outPath: outPng,
    qrWidth: 400,
  })
  fs.writeFileSync(outTxt, `${loginUrl}\n`, 'utf8')

  console.log('>> 使用地址:', origin)
  console.log('>> 店主手机号:', cfg.adminPhone)
  console.log('>> 登录链接:', loginUrl)
  console.log('>> 已生成:', outPng)
  console.log('>> 链接文本:', outTxt)
  if (origin.startsWith('http://localhost') || origin.startsWith('http://192.168.')) {
    console.log('>> 提示：线上管理请先在 deploy.config.json 填 publicUrl，再 gen-admin-qr')
    console.log('>> adminSecret 须为 GitHub 令牌（repo 读写），仅店主保存此二维码')
  } else {
    console.log('>> 与顾客同域名；扫码后手机即可管理，约 1 分钟同步到顾客视图')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
