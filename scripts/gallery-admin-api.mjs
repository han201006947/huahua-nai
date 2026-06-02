/**
 * 作品集本地管理：增删 public 内款式文件并 sync galleryAlbums.js（仅开发环境 API 调用）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { spawnSync } from 'child_process'
import {
  findCategoryByKey,
  getAllCategories,
  loadCustomCategories,
  saveCustomCategories,
} from './gallery-categories.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const publicRoot = path.join(projectRoot, 'public')
const overridesFile = path.join(projectRoot, 'src', 'data', 'galleryAlbums.overrides.js')
const syncScript = path.join(projectRoot, 'scripts', 'sync-gallery-albums.mjs')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])

// 读取请求体 JSON（兼容 Node HTTP IncomingMessage）
export function readJsonBody(req, maxBytes = 80 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('上传体积过大，请分批添加或压缩图片'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve(text ? JSON.parse(text) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

// 发送 JSON 响应
export function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

// 运行 sync-gallery 并重新加载相册列表
export async function runSyncAndLoad() {
  const r = spawnSync(process.execPath, [syncScript], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || 'sync-gallery 失败')
  }
  return loadAlbumsFromGenerated()
}

// 从已生成的 galleryAlbums.js 动态导入
async function loadAlbumsFromGenerated() {
  const modPath = path.join(projectRoot, 'src', 'data', 'galleryAlbums.js')
  const url = `${pathToFileURL(modPath).href}?t=${Date.now()}`
  const mod = await import(url)
  return mod.galleryAlbums
}

// 返回全部分类（内置 + 自定义）
export function listCategories() {
  return getAllCategories().map((c) => ({
    key: c.key,
    dir: c.dir,
    category: c.category,
    titlePrefix: c.titlePrefix,
  }))
}

// 生成未占用的 public 子目录名 cat1、cat2…
function nextCategoryDir() {
  const all = getAllCategories()
  const used = new Set(all.map((c) => c.dir))
  let n = 1
  while (used.has(`cat${n}`)) n += 1
  return `cat${n}`
}

// 从目录名取款式子文件夹前缀（cat3 → c，tiepian → t）
function defaultFolderPrefix(dir) {
  const m = dir.match(/[a-z]/i)
  return m ? m[0].toLowerCase() : 'x'
}

// 新增作品集分类：写入 custom.json 并创建 public 空目录
export async function addCategory(payload) {
  const category = String(payload?.category || '').trim()
  const titlePrefix = String(payload?.titlePrefix || '').trim() || category
  if (!category) throw new Error('请填写分类名称')

  const all = getAllCategories()
  if (all.some((c) => c.category === category)) {
    throw new Error(`分类「${category}」已存在`)
  }

  const dir = nextCategoryDir()
  const key = dir
  const folderPrefix = defaultFolderPrefix(dir)
  const entry = { dir, key, category, titlePrefix, folderPrefix }

  const custom = loadCustomCategories()
  custom.push(entry)
  saveCustomCategories(custom)

  const catDir = path.join(publicRoot, dir)
  fs.mkdirSync(catDir, { recursive: true })

  return { category: entry, categories: listCategories() }
}

// 列出当前全部相册
export async function listAlbums() {
  return loadAlbumsFromGenerated()
}

// 加载 overrides 对象
async function loadOverrides() {
  const mod = await import(pathToFileURL(overridesFile).href)
  return { ...(mod.albumOverrides || {}) }
}

// 写回 overrides 文件
function writeOverrides(overrides) {
  const lines = [
    '// 相册手动覆盖：标题、仅看款式、媒体顺序等（键为相册 id）',
    'export const albumOverrides = {',
  ]
  for (const [id, o] of Object.entries(overrides)) {
    lines.push(`  '${id}': {`)
    if (o.title) lines.push(`    title: '${String(o.title).replace(/'/g, "\\'")}',`)
    if (o.stylePreview) lines.push('    stylePreview: true,')
    if (o.mediaOrder?.length) {
      lines.push('    mediaOrder: [')
      for (const src of o.mediaOrder) {
        lines.push(`      '${src}',`)
      }
      lines.push('    ],')
    }
    lines.push('  },')
  }
  lines.push('}', '')
  fs.writeFileSync(overridesFile, lines.join('\n'), 'utf8')
}

// 在分类目录下生成下一个文件夹名，如 c5、f3
function nextFolderName(catDir, folderPrefix) {
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true })
  const entries = fs.readdirSync(catDir, { withFileTypes: true })
  let max = 0
  const re = new RegExp(`^${folderPrefix}(\\d+)`, 'i')
  for (const entry of entries) {
    const base = entry.isDirectory() ? entry.name : path.parse(entry.name).name
    const m = base.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${folderPrefix}${max + 1}`
}

// 校验上传文件名与扩展名（保留中文，去掉路径等特殊字符）
function sanitizeFileName(name, index = 0) {
  const base = path.basename(String(name || `photo-${index + 1}.jpg`))
  const ext = path.extname(base).toLowerCase()
  if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) {
    throw new Error(`不支持的文件类型：${ext || '(无扩展名)'}`)
  }
  const stem = path.parse(base).name
  const safeStem = stem.replace(/[^\w\u4e00-\u9fff.-]/g, '_').replace(/_+/g, '_').slice(0, 80)
  return `${safeStem || `photo-${index + 1}`}${ext}`
}

// 解码 base64 文件内容
function decodeBase64(data) {
  const raw = String(data || '')
  const b64 = raw.includes(',') ? raw.split(',')[1] : raw
  return Buffer.from(b64, 'base64')
}

// 新增款式：在 public/{dir}/{prefixN}/ 下写入图片/视频
export async function addAlbum(payload) {
  const categoryKey = payload?.categoryKey
  const cat = findCategoryByKey(categoryKey)
  if (!cat) throw new Error('请选择有效分类')

  const files = payload?.files
  if (!Array.isArray(files) || !files.length) throw new Error('请至少上传一张图片或一个视频')

  const catDir = path.join(publicRoot, cat.dir)
  const folderName = nextFolderName(catDir, cat.folderPrefix)
  const albumDir = path.join(catDir, folderName)
  fs.mkdirSync(albumDir, { recursive: true })

  for (let i = 0; i < files.length; i += 1) {
    const item = files[i]
    const safeName = sanitizeFileName(item.name, i)
    const buf = decodeBase64(item.data)
    if (!buf.length) throw new Error(`文件 ${safeName} 内容为空`)
    fs.writeFileSync(path.join(albumDir, safeName), buf)
  }

  const albumId = `${cat.key}-${folderName}`
  const title = String(payload?.title || '').trim()
  const stylePreview = Boolean(payload?.stylePreview)

  if (title || stylePreview) {
    const overrides = await loadOverrides()
    overrides[albumId] = {
      ...(overrides[albumId] || {}),
      ...(title ? { title } : {}),
      ...(stylePreview ? { stylePreview: true } : {}),
    }
    writeOverrides(overrides)
  }

  const albums = await runSyncAndLoad()
  const created = albums.find((a) => a.id === albumId)
  return { albumId, album: created, albums }
}

// 递归删除目录
function rmDirRecursive(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) rmDirRecursive(full)
    else fs.rmSync(full, { force: true })
  }
  fs.rmdirSync(dir)
}

// 根据相册 id 定位 public 内文件或文件夹并删除
function deleteAlbumFiles(albumId) {
  const dash = albumId.indexOf('-')
  if (dash < 1) throw new Error('相册 id 无效')
  const catKey = albumId.slice(0, dash)
  const entryName = albumId.slice(dash + 1)
  const cat = findCategoryByKey(catKey)
  if (!cat) throw new Error('未找到相册分类')

  const catDir = path.join(publicRoot, cat.dir)
  const folderPath = path.join(catDir, entryName)
  const fileCandidates = IMAGE_EXT.has(path.extname(entryName).toLowerCase())
    ? [folderPath]
    : [
        folderPath,
        ...[...IMAGE_EXT, ...VIDEO_EXT].map((ext) => path.join(catDir, entryName + ext)),
      ]

  let removed = false
  if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
    rmDirRecursive(folderPath)
    removed = true
  } else {
    for (const fp of fileCandidates) {
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        fs.rmSync(fp, { force: true })
        removed = true
        break
      }
    }
  }

  if (!removed) throw new Error('磁盘上未找到该款式文件，可能已被手动删除')
}

// 删除款式：删 public 文件 + overrides 条目 + sync
export async function deleteAlbum(albumId) {
  if (!albumId) throw new Error('缺少相册 id')
  deleteAlbumFiles(albumId)

  const overrides = await loadOverrides()
  if (overrides[albumId]) {
    delete overrides[albumId]
    writeOverrides(overrides)
  }

  const albums = await runSyncAndLoad()
  return { albumId, albums }
}

// 定位相册在 public 内的存储（文件夹或单文件）
function resolveAlbumStorage(albumId) {
  const dash = albumId.indexOf('-')
  if (dash < 1) throw new Error('相册 id 无效')
  const catKey = albumId.slice(0, dash)
  const entryName = albumId.slice(dash + 1)
  const cat = findCategoryByKey(catKey)
  if (!cat) throw new Error('未找到相册分类')

  const catDir = path.join(publicRoot, cat.dir)
  const folderPath = path.join(catDir, entryName)
  if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
    return { type: 'folder', dir: folderPath, catDir, entryName, albumId }
  }

  const directFile = path.join(catDir, entryName)
  if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
    return { type: 'file', filePath: directFile, catDir, entryName, albumId }
  }

  for (const ext of [...IMAGE_EXT, ...VIDEO_EXT]) {
    const fp = path.join(catDir, entryName + ext)
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      return { type: 'file', filePath: fp, catDir, entryName, albumId }
    }
  }

  throw new Error('磁盘上未找到该款式目录')
}

// 单文件相册转为文件夹，便于继续追加媒体
function ensureAlbumFolder(storage) {
  if (storage.type === 'folder') return storage.dir
  const folderPath = path.join(storage.catDir, storage.entryName)
  fs.mkdirSync(folderPath, { recursive: true })
  const dest = path.join(folderPath, path.basename(storage.filePath))
  fs.renameSync(storage.filePath, dest)
  return folderPath
}

// web 路径转 public 绝对路径并校验
function srcToPublicPath(src) {
  const rel = String(src || '').replace(/^\.\//, '').replace(/^\//, '')
  if (!rel || rel.includes('..')) throw new Error('媒体路径无效')
  const abs = path.join(publicRoot, rel)
  if (!abs.startsWith(publicRoot)) throw new Error('媒体路径无效')
  return { rel, abs }
}

// 从 overrides 的 mediaOrder 中移除已删文件
async function removeSrcFromOverrides(albumId, src) {
  const overrides = await loadOverrides()
  const o = overrides[albumId]
  if (!o?.mediaOrder?.length) return
  const normalized = String(src).replace(/^\.\//, '')
  o.mediaOrder = o.mediaOrder.filter((s) => {
    const r = String(s).replace(/^\.\//, '')
    return r !== normalized && s !== src
  })
  if (!o.mediaOrder.length) delete o.mediaOrder
  if (Object.keys(o).length === 0) delete overrides[albumId]
  writeOverrides(overrides)
}

// 详情内删除单张图/单个视频
export async function deleteAlbumMedia(albumId, src) {
  if (!albumId || !src) throw new Error('缺少相册 id 或媒体路径')
  const { abs } = srcToPublicPath(src)
  if (!fs.existsSync(abs)) throw new Error('文件不存在或已被删除')
  fs.rmSync(abs, { force: true })
  await removeSrcFromOverrides(albumId, src)

  const albums = await runSyncAndLoad()
  const album = albums.find((a) => a.id === albumId) || null
  return { albumId, album, albums }
}

// 详情内追加图片/视频到已有款式
export async function addAlbumMedia(albumId, payload) {
  if (!albumId) throw new Error('缺少相册 id')
  const files = payload?.files
  if (!Array.isArray(files) || !files.length) throw new Error('请选择至少一张图片或一个视频')

  const storage = resolveAlbumStorage(albumId)
  const albumDir = ensureAlbumFolder(storage)

  for (let i = 0; i < files.length; i += 1) {
    const item = files[i]
    const safeName = sanitizeFileName(item.name, i)
    const buf = decodeBase64(item.data)
    if (!buf.length) throw new Error(`文件 ${safeName} 内容为空`)
    fs.writeFileSync(path.join(albumDir, safeName), buf)
  }

  const albums = await runSyncAndLoad()
  const album = albums.find((a) => a.id === albumId) || null
  return { albumId, album, albums }
}
