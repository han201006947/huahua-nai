/**
 * 作品集数据：线上顾客与店主共用 galleryAlbums.js；仅管理写操作走 GitHub API
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'
import { getGithubToken, isOnlineAdminMode } from './useAdminAuth.js'
import { requestListAlbums, requestListCategories } from './useGalleryAdminApi.js'
import { fetchGalleryRevision, fetchPublicGalleryAlbums } from '../utils/githubContents.js'

// 构建时注入的 revision 快照（与 deploy 时 public/gallery-revision.json 一致）
const buildRev =
  typeof __GALLERY_BUILD_REV__ !== 'undefined' ? Number(__GALLERY_BUILD_REV__) || 0 : 0
const buildLatestIds =
  typeof __GALLERY_BUILD_LATEST_IDS__ !== 'undefined' && Array.isArray(__GALLERY_BUILD_LATEST_IDS__)
    ? [...__GALLERY_BUILD_LATEST_IDS__]
    : []

const albumsRef = shallowRef(staticAlbums)
const categoryOptionsRef = shallowRef([])
// 「最新款式」：首屏用构建快照，后台 revision 有变再更新
const latestAlbumIdsRef = shallowRef([...buildLatestIds])
const isDev = import.meta.env.DEV
// 与构建 revision 对齐，远程 rev 相同则跳过拉大文件
let lastOnlineRev = buildRev || null
let lastLatestIdsKey = buildLatestIds.join(',')
// 首次后台同步必拉一次完整列表（避免 rev 相同但打包列表过旧）
let onlineListVerified = false

// 店主增删后立刻更新置顶 id 与 revision（不必等轮询）
export function patchOnlineGalleryMeta(meta = {}) {
  if (Array.isArray(meta.latestIds)) {
    latestAlbumIdsRef.value = [...meta.latestIds]
    lastLatestIdsKey = meta.latestIds.join(',')
  }
  if (meta.rev != null) lastOnlineRev = meta.rev
}

// 判断 latestIds 里是否有款式尚未出现在当前列表
function albumsMissingLatest(ids, list) {
  if (!ids?.length) return false
  const set = new Set(list.map((a) => a.id))
  return ids.some((id) => !set.has(id))
}

// 列表 id 序列相同则不必重绘网格（减少扫码后闪烁）
function albumsListSame(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) return false
  }
  return true
}

// 仅 dev 或店主已登录时走管理 API 热更新分类
function canHotReload() {
  if (isDev) return true
  return isOnlineAdminMode() && Boolean(getGithubToken())
}

export function useGalleryAlbums() {
  // 线上：先比对轻量 revision，有变才拉 galleryAlbums.js
  async function tickOnlineGallery() {
    if (isDev || !isOnlineAdminMode()) return { changed: false }
    try {
      const revData = await fetchGalleryRevision()
      latestAlbumIdsRef.value = [...revData.latestIds]
      const idsKey = revData.latestIds.join(',')
      const revChanged = lastOnlineRev !== null && revData.rev !== lastOnlineRev
      const idsChanged = idsKey !== lastLatestIdsKey
      const missingLatest = albumsMissingLatest(revData.latestIds, albumsRef.value)
      lastOnlineRev = revData.rev
      lastLatestIdsKey = idsKey
      const needFullList =
        !onlineListVerified || revChanged || idsChanged || missingLatest
      onlineListVerified = true
      if (!needFullList) {
        return { changed: false }
      }
      const list = await fetchPublicGalleryAlbums(revData.rev)
      if (albumsListSame(albumsRef.value, list)) {
        return { changed: false }
      }
      albumsRef.value = [...list]
      return { changed: true }
    } catch {
      if (lastOnlineRev !== null) return { changed: false }
      try {
        const list = await fetchPublicGalleryAlbums()
        if (albumsListSame(albumsRef.value, list)) {
          lastOnlineRev = buildRev || 0
          return { changed: false }
        }
        albumsRef.value = [...list]
        lastOnlineRev = buildRev || 0
        return { changed: true }
      } catch {
        return { changed: false }
      }
    }
  }

  // 强制全量刷新（从后台返回等）
  async function refreshOnlineGallery() {
    lastOnlineRev = null
    lastLatestIdsKey = ''
    return tickOnlineGallery().then((r) => r.changed)
  }

  async function reloadCategories() {
    if (!canHotReload()) return
    if (isDev) {
      const res = await fetch('/api/gallery/categories')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '加载分类失败')
      }
      const data = await res.json()
      categoryOptionsRef.value = [...(data.categories || [])]
      return
    }
    const data = await requestListCategories()
    categoryOptionsRef.value = [...(data.categories || [])]
  }

  async function reloadAlbums() {
    if (isDev) {
      const res = await fetch('/api/gallery/albums')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '加载作品集失败')
      }
      const data = await res.json()
      albumsRef.value = [...(data.albums || [])]
      return
    }
    if (isOnlineAdminMode()) {
      lastOnlineRev = null
      await tickOnlineGallery()
      return
    }
    if (!canHotReload()) return
    const data = await requestListAlbums()
    albumsRef.value = [...(data.albums || [])]
  }

  return {
    albums: albumsRef,
    categoryOptions: categoryOptionsRef,
    latestAlbumIds: latestAlbumIdsRef,
    reloadAlbums,
    reloadCategories,
    refreshOnlineGallery,
    tickOnlineGallery,
    refreshCustomerAlbums: refreshOnlineGallery,
    tickCustomerGallery: tickOnlineGallery,
    isDev,
  }
}
