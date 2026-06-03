/**
 * 作品集数据：本地 dev / 线上店主登录后可热更新
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'
import { getGithubToken, isOnlineAdminMode } from './useAdminAuth.js'
import { requestListAlbums, requestListCategories } from './useGalleryAdminApi.js'
import { fetchGalleryAlbumsFromRepo } from '../utils/githubContents.js'
import { scanAlbumsFromPublicRepo } from '../utils/galleryRepoScan.js'

const albumsRef = shallowRef(staticAlbums)
const categoryOptionsRef = shallowRef([])
const isDev = import.meta.env.DEV

// 仅 dev 或店主已登录时热更新（顾客直接用打包静态数据，加快首屏）
function canHotReload() {
  if (isDev) return true
  return isOnlineAdminMode() && Boolean(getGithubToken())
}

export function useGalleryAlbums() {
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
    // 店主线上：先单次 raw 拉 galleryAlbums.js 秒开，再后台扫 public 补全新增
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
    reloadAlbums,
    reloadCategories,
    isDev,
  }
}
