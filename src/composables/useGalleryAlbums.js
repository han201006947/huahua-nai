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
// 线上上次见到的 revision，未变则不拉完整 galleryAlbums.js
let lastOnlineRev = null

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
      if (lastOnlineRev !== null && revData.rev === lastOnlineRev) {
        return { changed: false }
      }
      lastOnlineRev = revData.rev
      const list = await fetchPublicGalleryAlbums()
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
