/**
 * 作品集数据：本地 dev / 线上店主登录后可热更新；顾客端 revision 近实时轮询
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'
import { getGithubToken, isOnlineAdminMode } from './useAdminAuth.js'
import { requestListAlbums, requestListCategories } from './useGalleryAdminApi.js'
import {
  fetchGalleryAlbumsFromRepo,
  fetchGalleryRevision,
  fetchPublicGalleryAlbums,
} from '../utils/githubContents.js'
import { scanAlbumsFromPublicRepo } from '../utils/galleryRepoScan.js'

const albumsRef = shallowRef(staticAlbums)
const categoryOptionsRef = shallowRef([])
// 「最新款式」区块用的 id 列表（与 public/gallery-revision.json 同步）
const latestAlbumIdsRef = shallowRef([])
const isDev = import.meta.env.DEV
// 顾客端上次见到的 revision，未变则跳过拉完整 galleryAlbums.js
let lastCustomerRev = null

// 仅 dev 或店主已登录时热更新
function canHotReload() {
  if (isDev) return true
  return isOnlineAdminMode() && Boolean(getGithubToken())
}

export function useGalleryAlbums() {
  // 顾客：先读 revision（约 200B），有变化再拉完整列表
  async function tickCustomerGallery() {
    if (isDev || !isOnlineAdminMode() || getGithubToken()) return { changed: false }
    try {
      const revData = await fetchGalleryRevision()
      latestAlbumIdsRef.value = [...revData.latestIds]
      if (lastCustomerRev !== null && revData.rev === lastCustomerRev) {
        return { changed: false }
      }
      lastCustomerRev = revData.rev
      const list = await fetchPublicGalleryAlbums()
      albumsRef.value = [...list]
      return { changed: true }
    } catch {
      if (lastCustomerRev !== null) return { changed: false }
      try {
        const list = await fetchPublicGalleryAlbums()
        albumsRef.value = [...list]
        lastCustomerRev = 0
        return { changed: true }
      } catch {
        return { changed: false }
      }
    }
  }

  // 强制全量刷新（如从后台返回页面）
  async function refreshCustomerAlbums() {
    lastCustomerRev = null
    return tickCustomerGallery().then((r) => r.changed)
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
    if (!canHotReload()) return
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
    if (isOnlineAdminMode() && getGithubToken()) {
      try {
        const quick = await fetchGalleryAlbumsFromRepo()
        albumsRef.value = [...quick]
      } catch {
        /* 保留打包静态列表 */
      }
      scanAlbumsFromPublicRepo()
        .then((full) => {
          albumsRef.value = [...full]
        })
        .catch(() => {})
      return
    }
    const data = await requestListAlbums()
    albumsRef.value = [...(data.albums || [])]
  }

  return {
    albums: albumsRef,
    categoryOptions: categoryOptionsRef,
    latestAlbumIds: latestAlbumIdsRef,
    reloadAlbums,
    reloadCategories,
    refreshCustomerAlbums,
    tickCustomerGallery,
    isDev,
  }
}
