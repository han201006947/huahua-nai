/**
 * 作品集管理 API：本地 dev 走 Vite 插件，线上走 GitHub API
 */
import { isOnlineAdminMode, adminFetch } from './useAdminAuth.js'
import {
  onlineAddAlbum,
  onlineAddCategory,
  onlineDeleteAlbum,
  onlineDeleteCategory,
  onlineListAlbums,
  onlineListCategories,
} from './githubGalleryAdmin.js'

async function parseJson(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

// 拉取分类
export async function requestListCategories() {
  if (isOnlineAdminMode()) {
    return { categories: await onlineListCategories() }
  }
  const res = await adminFetch('/api/gallery/categories')
  return parseJson(res)
}

// 添加分类
export async function requestAddCategory(body) {
  if (isOnlineAdminMode()) {
    return onlineAddCategory(body)
  }
  const res = await adminFetch('/api/gallery/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

// 删除分类
export async function requestDeleteCategory(categoryKey) {
  if (isOnlineAdminMode()) {
    return onlineDeleteCategory(categoryKey)
  }
  const res = await adminFetch(`/api/gallery/categories/${encodeURIComponent(categoryKey)}`, {
    method: 'DELETE',
  })
  return parseJson(res)
}

// 拉取相册
export async function requestListAlbums() {
  if (isOnlineAdminMode()) {
    return { albums: await onlineListAlbums() }
  }
  const res = await adminFetch('/api/gallery/albums')
  return parseJson(res)
}

// 添加款式
export async function requestAddAlbum(body) {
  if (isOnlineAdminMode()) {
    return onlineAddAlbum(body)
  }
  const res = await adminFetch('/api/gallery/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

// 删除款式
export async function requestDeleteAlbum(albumId) {
  if (isOnlineAdminMode()) {
    return onlineDeleteAlbum(albumId)
  }
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}`, {
    method: 'DELETE',
  })
  return parseJson(res)
}

// 线上增删后 reload 即扫 public/，无需再等 Actions
export async function waitForGalleryUpdate() {
  return null
}

// 删除款式内单张图/视频（仅本地 dev 完整支持；线上提示 deploy 前本地删）
export async function requestDeleteAlbumMedia(albumId, src) {
  if (isOnlineAdminMode()) {
    throw new Error('线上暂不支持单张删除，请删整个款式或在电脑 dev 模式操作')
  }
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src }),
  })
  return parseJson(res)
}

export async function requestAddAlbumMedia(albumId, files) {
  if (isOnlineAdminMode()) {
    throw new Error('线上暂不支持详情内追加，请重新添加款式或在电脑 dev 模式操作')
  }
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })
  return parseJson(res)
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`))
    reader.readAsDataURL(file)
  })
}
