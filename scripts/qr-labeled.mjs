/**
 * 生成带中文标题的二维码 PNG（便于区分顾客 / 店主）
 */
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import sharp from 'sharp'

// XML 文本转义，避免 SVG 注入
function escXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 输出带标题的二维码图
 * @param {{ url: string, title: string, subtitle?: string, outPath: string, qrWidth?: number }} opts
 */
export async function writeLabeledQr(opts) {
  const url = String(opts.url || '').trim()
  const title = String(opts.title || '').trim()
  const subtitle = String(opts.subtitle || '').trim()
  const outPath = opts.outPath
  const qrWidth = opts.qrWidth || 480
  if (!url || !title || !outPath) throw new Error('writeLabeledQr 缺少 url / title / outPath')

  // 生成二维码位图
  const qrBuf = await QRCode.toBuffer(url, {
    width: qrWidth,
    margin: 2,
    color: { dark: '#3d2c2e', light: '#ffffff' },
  })
  const meta = await sharp(qrBuf).metadata()
  const qrW = meta.width || qrWidth
  const qrH = meta.height || qrWidth
  const padTop = 76
  const padBottom = subtitle ? 52 : 28
  const side = 24
  const totalW = qrW + side * 2
  const totalH = padTop + qrH + padBottom

  // 顶部标题 + 底部说明（SVG 叠在二维码上方/下方留白区）
  const subY = padTop + qrH + 34
  const subSvg = subtitle
    ? `<text x="50%" y="${subY}" text-anchor="middle" font-size="20" font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#666666">${escXml(subtitle)}</text>`
    : ''
  const svg = `<svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="46" text-anchor="middle" font-size="28" font-weight="600" font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#3d2c2e">${escXml(title)}</text>
  ${subSvg}
</svg>`

  const dir = path.dirname(outPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // 白底 + 标题 + 二维码
  await sharp(Buffer.from(svg))
    .composite([{ input: qrBuf, top: padTop, left: side }])
    .png()
    .toFile(outPath)
}
