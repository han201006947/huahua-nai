/**
 * 作品集数据：线上顾客与店主共用 galleryAlbums.js；仅管理写操作走 GitHub API
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'
import { getGithubToken, isOnlineAdminMode } from './useAdminAuth.js'
import { requestListAlbums, requestListCategories } from './useGalleryAdminApi.js'
import { fetchGalleryRevision, fetchPublicGalleryAlbums } from '../utils/githubContents.js'

const albumsRef = shallowRef(staticAlbums)
const categoryOptionsRef = shallowRef([])
// 「最新款式」置顶 id（public/gallery-revision.json）
const latestAlbumIdsRef = shallowRef([])
const isDev = import.meta.env.DEV
// 线上上次见到的 revision，未变则可能跳过拉 galleryAlbums.js
let lastOnlineRev = null
// 上次 latestIds 快照（rev 异常时仍能触发补拉）
let lastLatestIdsKey = ''

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

// 仅 dev 或店主已登录时走管理 API 热更新分类
function canHotReload() {
  if (isDev) return true
  return isOnlineAdminMode() && Boolean(getGithubToken())
}

export function useGalleryAlbums() {
  // 线上统一：顾客与店主读同一份 galleryAlbums.js + revision（内容一致）
  async function tickOnlineGallery() {
    if (isDev || !isOnlineAdminMode()) return { changed: false }
    try {
      const revData = await fetchGalleryRevision()
      latestAlbumIdsRef.value = [...revData.latestIds]
      const idsKey = revData.latestIds.join(',')
      const revChanged = lastOnlineRev !== null && revData.rev !== lastOnlineRev
      const idsChanged = idsKey !== lastLatestIdsKey
      const missingLatest = albumsMissingLatest(revData.latestIds, albumsRef.value)
      if (lastOnlineRev !== null && !revChanged && !idsChanged && !missingLatest) {
        return { changed: false }
      }
      lastOnlineRev = revData.rev
      lastLatestIdsKey = idsKey
      const list = await fetchPublicGalleryAlbums(revData.rev)
      albumsRef.value = [...list]
      return { changed: true }
    } catch {
      if (lastOnlineRev !== null) return { changed: false }
      try {
        const list = await fetchPublicGalleryAlbums()
        albumsRef.value = [...list]
        lastOnlineRev = 0
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
    // 线上店主/顾客：与 tickOnlineGallery 同源，不再扫 public/（慢且易与顾客不一致）
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
    // 兼容旧名
    refreshCustomerAlbums: refreshOnlineGallery,
    tickCustomerGallery: tickOnlineGallery,
    isDev,
  }
}
