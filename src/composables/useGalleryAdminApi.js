/**
 * 本地 dev 作品集管理 API（款式 / 详情内媒体，需店主 session）
 */
import { adminFetch } from './useAdminAuth.js'

// 删除整个款式
export async function requestDeleteAlbum(albumId) {
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '删除失败')
  return data
}

// 删除款式内单张图/单个视频
export async function requestDeleteAlbumMedia(albumId, src) {
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '删除失败')
  return data
}

// 向已有款式追加图片/视频
export async function requestAddAlbumMedia(albumId, files) {
  const res = await adminFetch(`/api/gallery/albums/${encodeURIComponent(albumId)}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '添加失败')
  return data
}

// File 转 base64（上传用）
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`))
    reader.readAsDataURL(file)
  })
}
