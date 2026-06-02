/**
 * 本地 dev：多标签/多设备（同站点）作品集数据变更广播，双方实时刷新
 */
import { onMounted, onUnmounted } from 'vue'

// BroadcastChannel 名称（仅 dev 使用）
const SYNC_CHANNEL = 'nail-gallery-sync'

// 单例频道，避免重复创建
let syncChannel = null

// 获取或创建广播频道（非 dev / 不支持时返回 null）
function getSyncChannel() {
  if (!import.meta.env.DEV) return null
  if (typeof BroadcastChannel === 'undefined') return null
  if (!syncChannel) syncChannel = new BroadcastChannel(SYNC_CHANNEL)
  return syncChannel
}

// 本页完成增删后通知其他标签/窗口刷新
export function notifyGallerySync() {
  const ch = getSyncChannel()
  if (!ch) return
  ch.postMessage({ type: 'refresh', at: Date.now() })
}

// 监听其他标签发来的刷新信号
export function useGallerySyncListener(callback) {
  onMounted(() => {
    const ch = getSyncChannel()
    if (!ch || typeof callback !== 'function') return
    ch.onmessage = () => callback()
  })
  onUnmounted(() => {
    const ch = getSyncChannel()
    if (ch) ch.onmessage = null
  })
}
