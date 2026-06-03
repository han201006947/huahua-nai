/**
 * 线上店主管理：通过 GitHub API 写入 public/ 与分类配置（无需本地 dev）
 */
import { BUILTIN_GALLERY_CATEGORIES } from '../data/galleryCategories.builtin.js'
import {
  deleteRepoFile,
  fetchGalleryAlbumsFromRepo,
  listRepoDir,
  readRepoText,
  writeRepoBinary,
  writeRepoText,
} from '../utils/githubContents.js'
import { scanAlbumsFromPublicRepo, scanAlbumsWithFallback, buildAlbumFromUpload } from '../utils/galleryRepoScan.js'
import { getGithubToken } from './useAdminAuth.js'

const CUSTOM_PATH = 'src/data/galleryCategories.custom.json'
const OVERRIDES_PATH = 'src/data/galleryAlbums.overrides.js'

// 合并内置与自定义分类
function mergeCategories(customList) {
  return [...BUILTIN_GALLERY_CATEGORIES, ...(customList || [])]
}

// 读取 custom.json
async function loadCustomCategories() {
  try {
    const { text } = await readRepoText(CUSTOM_PATH)
    const list = JSON.parse(text)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// 写 custom.json
async function saveCustomCategories(list) {
  const { sha } = await readRepoText(CUSTOM_PATH).catch(() => ({ sha: null }))
  await writeRepoText(CUSTOM_PATH, JSON.stringify(list, null, 2) + '\n', sha, 'chore: update gallery categories')
}

// 列出分类（供管理面板）
export async function onlineListCategories() {
  const custom = await loadCustomCategories()
  const customKeys = new Set(custom.map((c) => c.key))
  return mergeCategories(custom).map((c) => ({
    key: c.key,
    dir: c.dir,
    category: c.category,
    titlePrefix: c.titlePrefix,
    isCustom: customKeys.has(c.key),
  }))
}

// 生成 catN 目录名
function nextCategoryDir(all) {
  const used = new Set(all.map((c) => c.dir))
  let n = 1
  while (used.has(`cat${n}`)) n += 1
  return `cat${n}`
}

// 添加分类
export async function onlineAddCategory(payload) {
  const category = String(payload?.category || '').trim()
  const titlePrefix = String(payload?.titlePrefix || '').trim() || category
  if (!category) throw new Error('请填写分类名称')

  const all = mergeCategories(await loadCustomCategories())
  if (all.some((c) => c.category === category)) throw new Error(`分类「${category}」已存在`)

  const dir = nextCategoryDir(all)
  const entry = {
    dir,
    key: dir,
    category,
    titlePrefix,
    folderPrefix: (dir.match(/[a-z]/i) || ['x'])[0].toLowerCase(),
  }

  const custom = await loadCustomCategories()
  custom.push(entry)
  await saveCustomCategories(custom)
  await writeRepoText(`public/${dir}/.gitkeep`, '', null, `chore: add category ${category}`)

  return { category: entry, categories: await onlineListCategories() }
}

// 递归删除 GitHub 目录下所有文件
async function deleteRepoDir(dirPath) {
  let entries = []
  try {
    entries = await listRepoDir(dirPath)
  } catch {
    return
  }
  for (const entry of entries) {
    const p = `${dirPath}/${entry.name}`
    if (entry.type === 'dir') await deleteRepoDir(p)
    else await deleteRepoFile(p, entry.sha, `chore: remove ${p}`)
  }
}

// 删除自建分类
export async function onlineDeleteCategory(categoryKey) {
  const key = String(categoryKey || '').trim()
  if (BUILTIN_GALLERY_CATEGORIES.some((c) => c.key === key)) throw new Error('内置分类不可删除')

  const custom = await loadCustomCategories()
  const idx = custom.findIndex((c) => c.key === key)
  if (idx < 0) throw new Error('仅可删除自建分类')

  const cat = custom[idx]
  await deleteRepoDir(`public/${cat.dir}`)
  custom.splice(idx, 1)
  await saveCustomCategories(custom)

  const albums = await loadAlbumsForAdmin()
  return { categoryKey: key, categories: await onlineListCategories(), albums }
}

// 读 overrides 文件为对象
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

// 写 overrides
async function saveOverridesObject(overrides) {
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
      for (const src of o.mediaOrder) lines.push(`      '${src}',`)
      lines.push('    ],')
    }
    lines.push('  },')
  }
  lines.push('}', '')
  const content = lines.join('\n')
  const { sha } = await readRepoText(OVERRIDES_PATH).catch(() => ({ sha: null }))
  await writeRepoText(OVERRIDES_PATH, content, sha, 'chore: update album overrides')
}

// 按 key 找分类
function findCategoryByKey(key, custom) {
  return mergeCategories(custom).find((c) => c.key === key) || null
}

// 下一款式文件夹名
async function nextFolderName(catDir, folderPrefix) {
  let entries = []
  try {
    entries = await listRepoDir(`public/${catDir}`)
  } catch {
    entries = []
  }
  let max = 0
  const re = new RegExp(`^${folderPrefix}(\\d+)`, 'i')
  for (const entry of entries) {
    const base = entry.type === 'dir' ? entry.name : entry.name.replace(/\.[^.]+$/, '')
    const m = base.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${folderPrefix}${max + 1}`
}

// 安全文件名
function sanitizeFileName(name, index = 0) {
  const base = String(name || `photo-${index + 1}.jpg`).split(/[/\\]/).pop()
  const ext = (base.match(/(\.[a-z0-9]+)$/i) || ['', '.jpg'])[1].toLowerCase()
  const stem = base.slice(0, -ext.length)
  const safeStem = stem.replace(/[^\w\u4e00-\u9fff.-]/g, '_').replace(/_+/g, '_').slice(0, 80)
  return `${safeStem || `photo-${index + 1}`}${ext}`
}

// 添加款式
export async function onlineAddAlbum(payload) {
  const categoryKey = payload?.categoryKey
  const custom = await loadCustomCategories()
  const cat = findCategoryByKey(categoryKey, custom)
  if (!cat) throw new Error('请选择有效分类')

  const files = payload?.files
  if (!Array.isArray(files) || !files.length) throw new Error('请至少上传一张图片或一个视频')

  const folderName = await nextFolderName(cat.dir, cat.folderPrefix)
  const uploadedNames = []
  for (let i = 0; i < files.length; i += 1) {
    const safeName = sanitizeFileName(files[i].name, i)
    uploadedNames.push(safeName)
    const repoPath = `public/${cat.dir}/${folderName}/${safeName}`
    await writeRepoBinary(repoPath, files[i].data, null, `feat: add ${repoPath}`)
  }

  const albumId = `${cat.key}-${folderName}`
  const title = String(payload?.title || '').trim()
  const stylePreview = Boolean(payload?.stylePreview)
  if (title || stylePreview) {
    const overrides = await loadOverridesObject()
    overrides[albumId] = {
      ...(overrides[albumId] || {}),
      ...(title ? { title } : {}),
      ...(stylePreview ? { stylePreview: true } : {}),
    }
    await saveOverridesObject(overrides)
  }

  const optimistic = buildAlbumFromUpload(cat, folderName, uploadedNames, { title, stylePreview })
  const albums = await scanAlbumsWithFallback(optimistic, albumId)
  const album = albums.find((a) => a.id === albumId) || optimistic
  return { albumId, album, albums, category: cat.category }
}

// 删除款式目录或文件
export async function onlineDeleteAlbum(albumId) {
  const dash = albumId.indexOf('-')
  if (dash < 1) throw new Error('相册 id 无效')
  const catKey = albumId.slice(0, dash)
  const entryName = albumId.slice(dash + 1)
  const custom = await loadCustomCategories()
  const cat = findCategoryByKey(catKey, custom)
  if (!cat) throw new Error('未找到相册分类')

  const folderPath = `public/${cat.dir}/${entryName}`
  try {
    await deleteRepoDir(folderPath)
  } catch {
    const entries = await listRepoDir(`public/${cat.dir}`)
    const hit = entries.find((e) => e.name.startsWith(entryName))
    if (hit) await deleteRepoFile(`public/${cat.dir}/${hit.name}`, hit.sha, `chore: delete ${albumId}`)
  }

  const overrides = await loadOverridesObject()
  if (overrides[albumId]) {
    delete overrides[albumId]
    await saveOverridesObject(overrides)
  }

  return { albumId, albums: await loadAlbumsForAdmin() }
}

// 店主已登录：扫 public/ 立即可见；未登录：读 galleryAlbums.js
async function loadAlbumsForAdmin() {
  if (getGithubToken()) return scanAlbumsFromPublicRepo()
  return fetchGalleryAlbumsFromRepo()
}

// 列出相册
export async function onlineListAlbums() {
  return loadAlbumsForAdmin()
}
