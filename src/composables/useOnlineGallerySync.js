/**
 * 线上作品集后台同步：在 LatestStylesSection 挂载（不必等作品集 lazy load）
 */
import { onMounted, onUnmounted } from 'vue'
import { isOnlineAdminMode } from './useAdminAuth.js'
import { useGalleryAlbums } from './useGalleryAlbums.js'

// 首屏先出静态 latest，idle 后再轻量比对 revision
const BG_SYNC_IDLE_MS = 8000
const ONLINE_POLL_MS = 30000
let onlinePollTimer = null
let bgSyncScheduled = false

export function useOnlineGallerySync(onListChanged) {
  const { tickOnlineGallery, refreshOnlineGallery } = useGalleryAlbums()

  async function applySync(force = false) {
    const changed = force
      ? await refreshOnlineGallery()
      : (await tickOnlineGallery()).changed
    if (changed && onListChanged) onListChanged()
  }

  function scheduleBackgroundSync() {
    if (bgSyncScheduled || !isOnlineAdminMode()) return
    bgSyncScheduled = true
    const runFirst = () => {
      void applySync(false)
    }
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(runFirst, { timeout: BG_SYNC_IDLE_MS })
    } else {
      setTimeout(runFirst, BG_SYNC_IDLE_MS)
    }
    onlinePollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void applySync(false)
    }, ONLINE_POLL_MS)
  }

  function onVisibilityRefresh() {
    if (document.visibilityState !== 'visible') return
    void applySync(false)
  }

  onMounted(() => {
    if (!isOnlineAdminMode()) return
    scheduleBackgroundSync()
    document.addEventListener('visibilitychange', onVisibilityRefresh)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityRefresh)
    if (onlinePollTimer) window.clearInterval(onlinePollTimer)
  })
}
