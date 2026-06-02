/**
 * 作品集数据：开发态可从本地 API 热更新，生产态仍用构建时的静态 JS
 */
import { shallowRef } from 'vue'
import { galleryAlbums as staticAlbums } from '../data/galleryAlbums.js'

// 响应式相册列表（开发增删后替换）
const albumsRef = shallowRef(staticAlbums)

// 是否开发环境（Vite 注入，生产 build 为 false）
const isDev = import.meta.env.DEV

// 读取相册列表
export function useGalleryAlbums() {
  // 从本地 API 拉取最新列表（仅 dev 有效）
  async function reloadAlbums() {
    if (!isDev) return
    const res = await fetch('/api/gallery/albums')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '加载作品集失败')
    }
    const data = await res.json()
    albumsRef.value = data.albums || []
  }

  return { albums: albumsRef, reloadAlbums, isDev }
}
