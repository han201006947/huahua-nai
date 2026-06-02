/**
 * 扫描 public 下各分类文件夹，按「一文件夹/一图片/一视频 = 一相册」生成 galleryAlbums.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const publicRoot = path.join(projectRoot, 'public')
const outFile = path.join(projectRoot, 'src', 'data', 'galleryAlbums.js')
const overridesFile = path.join(projectRoot, 'src', 'data', 'galleryAlbums.overrides.js')

import { GALLERY_CATEGORIES } from './gallery-categories.mjs'

// 分类文件夹 → 网站显示名与标题前缀（与 gallery-categories.mjs 共用）
const CATEGORIES = GALLERY_CATEGORIES

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])

// 自然排序：m1 m2 m10 按数字顺序
function naturalCompare(a, b) {
  return a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

function isImage(file) {
  return IMAGE_EXT.has(path.extname(file).toLowerCase())
}

function isVideo(file) {
  return VIDEO_EXT.has(path.extname(file).toLowerCase())
}

function toWebPath(categoryDir, ...parts) {
  // 用 ./ 相对路径，兼容 GitHub Pages 子目录与 file:// 离线包
  return `./${categoryDir}/${parts.join('/')}`.replace(/\\/g, '/')
}

function buildMediaFromFiles(files, categoryDir, relPrefix) {
  const images = files.filter(isImage).sort(naturalCompare)
  const videos = files.filter(isVideo).sort(naturalCompare)
  const media = []
  for (const name of images) {
    media.push({ type: 'image', src: toWebPath(categoryDir, relPrefix, name).replace(/\/+/g, '/') })
  }
  for (const name of videos) {
    media.push({ type: 'video', src: toWebPath(categoryDir, relPrefix, name).replace(/\/+/g, '/') })
  }
  return media
}

function pickCover(media) {
  const firstImage = media.find((m) => m.type === 'image')
  if (firstImage) return { cover: firstImage.src, coverVideo: null }
  const firstVideo = media.find((m) => m.type === 'video')
  return { cover: firstVideo.src, coverVideo: firstVideo.src }
}

function applyOverrides(album, overrides) {
  const o = overrides[album.id]
  if (!o) return album
  if (o.title) album.title = o.title
  if (o.stylePreview) album.stylePreview = true
  if (o.mediaOrder?.length) {
    const map = new Map(album.media.map((m) => [m.src, m]))
    album.media = o.mediaOrder.map((src) => map.get(src)).filter(Boolean)
    const picked = pickCover(album.media)
    album.cover = picked.cover
    album.coverVideo = picked.coverVideo
  }
  return album
}

function scanCategory(catConfig, overrides) {
  const catPath = path.join(publicRoot, catConfig.dir)
  if (!fs.existsSync(catPath)) return []

  const entries = fs.readdirSync(catPath, { withFileTypes: true }).sort((a, b) =>
    naturalCompare(a.name, b.name)
  )

  const albums = []
  let index = 0

  for (const entry of entries) {
    index += 1
    let id
    let media = []

    if (entry.isDirectory()) {
      const subPath = path.join(catPath, entry.name)
      const files = fs.readdirSync(subPath).filter((f) => isImage(f) || isVideo(f))
      if (!files.length) continue
      id = `${catConfig.key}-${entry.name}`
      media = buildMediaFromFiles(files, catConfig.dir, entry.name)
    } else if (entry.isFile()) {
      if (!isImage(entry.name) && !isVideo(entry.name)) continue
      const stem = path.parse(entry.name).name
      id = `${catConfig.key}-${stem}`
      media = buildMediaFromFiles([entry.name], catConfig.dir, '')
      media = media.map((m) => ({ ...m, src: toWebPath(catConfig.dir, entry.name) }))
    } else {
      continue
    }

    const hasVideo = media.some((m) => m.type === 'video')
    const videoOnly = media.length > 0 && media.every((m) => m.type === 'video')
    const { cover, coverVideo } = pickCover(media)

    const album = {
      id,
      title: `${catConfig.titlePrefix} ${index}`,
      category: catConfig.category,
      cover,
      hasVideo,
      media,
    }
    if (coverVideo) album.coverVideo = coverVideo
    if (videoOnly) album.videoOnly = true

    albums.push(applyOverrides(album, overrides))
  }

  return albums
}

function serializeAlbum(album) {
  const lines = [`  {`, `    id: '${album.id}',`, `    title: '${album.title}',`, `    category: '${album.category}',`]
  if (album.coverVideo) {
    lines.push(`    coverVideo: '${album.cover}',`)
  }
  lines.push(`    cover: '${album.cover}',`, `    hasVideo: ${album.hasVideo},`)
  if (album.stylePreview) lines.push(`    stylePreview: true,`)
  if (album.videoOnly) lines.push(`    videoOnly: true,`)
  lines.push(`    media: [`)
  for (const m of album.media) {
    lines.push(`      { type: '${m.type}', src: '${m.src}' },`)
  }
  lines.push(`    ],`, `  },`)
  return lines.join('\n')
}

async function main() {
  const { albumOverrides } = await import(pathToFileURL(overridesFile).href)
  const allAlbums = []
  for (const cat of CATEGORIES) {
    allAlbums.push(...scanCategory(cat, albumOverrides))
  }

  const header = `// 穿戴甲贴手示意文案：戴在手上仅看款式，非店内实拍服务
export const STYLE_PREVIEW_LABEL = {
  badgeEn: 'PRESS-ON DISPLAY',
  badgeZh: '仅看款式',
  notice: '穿戴甲贴手展示 · 仅看款式',
}

// 作品相册：由 scripts/sync-gallery-albums.mjs 根据 public 文件夹自动生成
// 更新 public 后运行 npm run sync-gallery；标题/仅看款式等见 galleryAlbums.overrides.js
export const galleryAlbums = [
`

  const body = allAlbums.map(serializeAlbum).join('\n')
  const footer = `\n]\n`

  fs.writeFileSync(outFile, header + body + footer, 'utf8')
  console.log(`>> synced ${allAlbums.length} albums -> src/data/galleryAlbums.js`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
