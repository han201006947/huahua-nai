/**
 * 「最新款式」展示逻辑：revision.latestIds 与打包列表取交集，最多 3 个
 */
import { computed } from 'vue'

// 首页最新区块最多展示数量
export const LATEST_DISPLAY_MAX = 3

// 由 latestIds + 全量列表生成展示用数组（缺 revision 时回退列表末尾新款）
export function buildLatestDisplayList(albums, latestIds, max = LATEST_DISPLAY_MAX) {
  const map = new Map(albums.map((a) => [a.id, a]))
  const ids = (latestIds || []).slice(0, max)
  let list = ids.map((id) => map.get(id)).filter(Boolean)
  if (!list.length && albums.length) {
    list = [...albums].slice(-max).reverse()
  }
  return list.slice(0, max)
}

// 组合式：绑定 useGalleryAlbums 的 albums / latestAlbumIds
export function useLatestDisplayAlbums(albumsRef, latestAlbumIdsRef) {
  return computed(() =>
    buildLatestDisplayList(albumsRef.value, latestAlbumIdsRef.value, LATEST_DISPLAY_MAX)
  )
}
