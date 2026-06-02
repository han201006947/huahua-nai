/**
 * 作品集数据：本地 dev / 线上店主登录后可热更新
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'
import { isOnlineAdminMode } from './useAdminAuth.js'
import { requestListAlbums, requestListCategories } from './useGalleryAdminApi.js'

const albumsRef = shallowRef(staticAlbums)
const categoryOptionsRef = shallowRef([])
const isDev = import.meta.env.DEV

function canHotReload() {
  return isDev || isOnlineAdminMode()
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
