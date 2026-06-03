/**
 * 线上店主预览：直接扫描 GitHub master 上 public/ 生成相册列表（无需等 Actions sync）
 */
import { BUILTIN_GALLERY_CATEGORIES } from '../data/galleryCategories.builtin.js'
import { listRepoDir, readRepoText } from './githubContents.js'

// 与 sync-gallery-albums.mjs 保持一致的路径
const CUSTOM_PATH = 'src/data/galleryCategories.custom.json'
const OVERRIDES_PATH = 'src/data/galleryAlbums.overrides.js'

// 图片 / 视频扩展名
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i
const VIDEO_EXT = /\.(mp4|webm|mov)$/i

// 自然排序
function naturalCompare(a, b) {
  return a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

// 是否图片
function isImage(name) {
  return IMAGE_EXT.test(name)
}

// 是否视频
function isVideo(name) {
  return VIDEO_EXT.test(name)
}

// 站点相对路径（与 sync-gallery 一致）
function toWebPath(categoryDir, ...parts) {
  return `./${categoryDir}/${parts.join('/')}`.replace(/\\/g, '/').replace(/\/+/g, '/')
}

// 由刚上传的文件名拼出一条相册（GitHub 列表有延迟时先乐观展示）
export function buildAlbumFromUpload(cat, folderName, fileNames, opts = {}) {
  const albumId = `${cat.key}-${folderName}`
  const media = fileNames.map((name) => {
    const isVid = VIDEO_EXT.test(name)
    return {
      type: isVid ? 'video' : 'image',
      src: toWebPath(cat.dir, folderName, name),
    }
  })
  const hasVideo = media.some((m) => m.type === 'video')
  const videoOnly = media.length > 0 && media.every((m) => m.type === 'video')
  const firstImage = media.find((m) => m.type === 'image')
  const cover = firstImage ? firstImage.src : media[0]?.src
  const album = {
    id: albumId,
    title: opts.title || `${cat.titlePrefix} ${folderName}`,
    category: cat.category,
    cover,
    hasVideo,
    media,
  }
  if (opts.stylePreview) album.stylePreview = true
  if (!firstImage && media[0]?.type === 'video') album.coverVideo = cover
  if (videoOnly) album.videoOnly = true
  return album
}

// 由文件名列表拼 media 数组
function buildMediaFromFiles(files, categoryDir, relPrefix) {
  const images = files.filter(isImage).sort(naturalCompare)
  const videos = files.filter(isVideo).sort(naturalCompare)
  const media = []
  for (const name of images) {
    media.push({ type: 'image', src: toWebPath(categoryDir, relPrefix, name) })
  }
  for (const name of videos) {
    media.push({ type: 'video', src: toWebPath(categoryDir, relPrefix, name) })
  }
  return media
}

// 选封面
function pickCover(media) {
  const firstImage = media.find((m) => m.type === 'image')
  if (firstImage) return { cover: firstImage.src, coverVideo: null }
  const firstVideo = media.find((m) => m.type === 'video')
  return { cover: firstVideo.src, coverVideo: firstVideo.src }
}

// 应用 overrides
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

// 读 custom.json
async function loadCustomCategories() {
  try {
    const { text } = await readRepoText(CUSTOM_PATH)
    const list = JSON.parse(text)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// 读 overrides.js
async function loadOverridesObject() {
  try {
    const { text } = await readRepoText(OVERRIDES_PATH)
    const blob = new Blob([text], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    try {
      const mod = await import(/* @vite-ignore */ url)
      return { ...(mod.albumOverrides || {}) }
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    return {}
  }
}

// 扫描单个分类目录（子文件夹并行 list，加快店主扫码后加载）
async function scanCategory(catConfig, overrides) {
  let entries = []
  try {
    entries = await listRepoDir(`public/${catConfig.dir}`)
  } catch {
    return []
  }
  entries.sort((a, b) => naturalCompare(a.name, b.name))

  const dirEntries = entries.filter((e) => e.type === 'dir' && e.name !== '.gitkeep')

  const subLists = await Promise.all(
    dirEntries.map((entry) =>
      listRepoDir(`public/${catConfig.dir}/${entry.name}`).catch(() => [])
    )
  )

  const albums = []
  let index = 0

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]
    if (entry.name === '.gitkeep') continue
    index += 1
    let id
    let media = []

    if (entry.type === 'dir') {
      const dirIdx = dirEntries.indexOf(entry)
      const subEntries = subLists[dirIdx] || []
      const files = subEntries
        .filter((f) => f.type === 'file' && (isImage(f.name) || isVideo(f.name)))
        .map((f) => f.name)
        .sort(naturalCompare)
      if (!files.length) continue
      id = `${catConfig.key}-${entry.name}`
      media = buildMediaFromFiles(files, catConfig.dir, entry.name)
    } else if (entry.type === 'file') {
      if (!isImage(entry.name) && !isVideo(entry.name)) continue
      const stem = entry.name.replace(/\.[^.]+$/, '')
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

// 扫描 public/ 下全部分类，供店主登录后立即预览
export async function scanAlbumsFromPublicRepo() {
  const [custom, overrides] = await Promise.all([loadCustomCategories(), loadOverridesObject()])
  const categories = [...BUILTIN_GALLERY_CATEGORIES, ...custom]
  const parts = await Promise.all(categories.map((cat) => scanCategory(cat, overrides)))
  return parts.flat()
}

// 扫描 GitHub；若新款式尚未出现在目录列表中则并入 fallback（刚上传常见）
export async function scanAlbumsWithFallback(fallbackAlbum, expectAlbumId) {
  let albums = []
  for (let i = 0; i < 3; i += 1) {
    try {
      albums = await scanAlbumsFromPublicRepo()
      if (albums.some((a) => a.id === expectAlbumId)) return albums
    } catch {
      /* GitHub 列表/API 偶发失败时重试 */
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 1200))
  }
  if (albums.some((a) => a.id === expectAlbumId)) return albums
  return [...albums, fallbackAlbum]
}

// 删除款式后扫描；GitHub 目录更新有延迟时乐观去掉已删 id
export async function scanAlbumsAfterDelete(deletedAlbumId) {
  for (let i = 0; i < 3; i += 1) {
    try {
      const albums = await scanAlbumsFromPublicRepo()
      if (!albums.some((a) => a.id === deletedAlbumId)) return albums
    } catch {
      /* 重试 */
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 1200))
  }
  try {
    const albums = await scanAlbumsFromPublicRepo()
    return albums.filter((a) => a.id !== deletedAlbumId)
  } catch {
    return []
  }
}

// 删除整个分类后扫描；仍列出该分类款式时乐观过滤
export async function scanAlbumsAfterDeleteCategory(categoryLabel, categoryKey) {
  const stillHas = (list) =>
    list.some((a) => a.category === categoryLabel || a.id.startsWith(`${categoryKey}-`))
  for (let i = 0; i < 3; i += 1) {
    try {
      const albums = await scanAlbumsFromPublicRepo()
      if (!stillHas(albums)) return albums
    } catch {
      /* 重试 */
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 1200))
  }
  try {
    const albums = await scanAlbumsFromPublicRepo()
    return albums.filter((a) => a.category !== categoryLabel && !a.id.startsWith(`${categoryKey}-`))
  } catch {
    return []
  }
}
