/**
 * 生成店主管理登录二维码（链接含密钥，仅店主保存此图）
 */
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import { fileURLToPath } from 'url'
import { buildAdminLoginUrl, loadAdminConfig } from './admin-auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const releaseDir = path.join(projectRoot, 'release')

// 管理 API 仅在 npm run dev 生效，默认 localhost（可用参数指定局域网 IP）
function resolveOrigin() {
  if (process.argv[2]) return process.argv[2].replace(/\/$/, '')
  return 'http://localhost:5173'
}

async function main() {
  const cfg = loadAdminConfig()
  const origin = process.argv[2] || resolveOrigin()
  const loginUrl = buildAdminLoginUrl(origin)
  if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true })
  const outPng = path.join(releaseDir, '店主管理登录二维码.png')
  await QRCode.toFile(outPng, loginUrl, { width: 320, margin: 2 })
  console.log('>> 店主手机号:', cfg.adminPhone)
  console.log('>> 登录链接:', loginUrl)
  console.log('>> 已生成:', outPng)
  console.log('>> 请仅店主保存此二维码；扫码后 7 天内可管理款式')
  console.log('>> 须先在本机运行 npm run dev；手机管理请传局域网地址，如:')
  console.log('>>   npm run gen-admin-qr http://192.168.1.100:5173')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
