/**
 * 本地 dev 作品集管理 API 封装（删除等）
 */

// 调用本地 API 删除指定相册（会删 public 文件并 sync）
export async function requestDeleteAlbum(albumId) {
  const res = await fetch(`/api/gallery/albums/${encodeURIComponent(albumId)}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '删除失败')
  return data
}
