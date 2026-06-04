<script setup>
// 美甲服务下方：最新上传 3 款（区块先出，封面略延后，避免与价目图抢带宽）
import { ref, computed, onMounted } from 'vue'
import { useGalleryAlbums } from '../composables/useGalleryAlbums.js'
import { useLatestDisplayAlbums } from '../composables/useLatestDisplayAlbums.js'
import { useOnlineGallerySync } from '../composables/useOnlineGallerySync.js'
import GalleryAlbumCard from './GalleryAlbumCard.vue'
import {
  assetUrl,
  ownerMasterFallbackUrl,
  pagesAssetUrl,
  pagesCoverThumbUrl,
} from '../utils/assetUrl.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const { albums, latestAlbumIds } = useGalleryAlbums()
const { isOwnerGalleryPreview } = useAdminAuth()

// 最多 3 个最新款（含 revision 回退）
const latestAlbums = useLatestDisplayAlbums(albums, latestAlbumIds)

// 后台 revision 同步（顾客不滚到作品集也能更新 latest）
useOnlineGallerySync()

const coverFailedIds = ref(new Set())
const landscapeKeys = ref(new Set())
// 首屏先出标题与占位，idle 后再拉 3 张缩略图
const loadLatestCovers = ref(false)

onMounted(() => {
  const start = () => {
    loadLatestCovers.value = true
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(start, { timeout: 1800 })
  } else {
    window.setTimeout(start, 700)
  }
})

const showBlock = computed(() => latestAlbums.value.length > 0)

function gridCoverIsVideo(album) {
  return /\.(mp4|webm|mov)$/i.test(album.cover || '')
}

function isLandscape(key) {
  return landscapeKeys.value.has(key)
}

function isCoverLandscapeVideo() {
  return false
}

function markLandscapeIfNeeded(event, key) {
  const el = event.target
  const w = el.naturalWidth || 0
  const h = el.naturalHeight || 0
  if (w > h) landscapeKeys.value = new Set([...landscapeKeys.value, key])
}

// 最新 3 张封面在 idle 后加载（仅 3 张，不阻塞价目 Hero）
function shouldLoadCover() {
  return loadLatestCovers.value
}

function onCoverImgError(event, album) {
  const img = event.target
  if (isOwnerGalleryPreview() && img.dataset.masterFallback !== '1') {
    img.dataset.masterFallback = '1'
    img.src = ownerMasterFallbackUrl(album.cover)
    return
  }
  if (img.dataset.fallback !== '1') {
    img.dataset.fallback = '1'
    img.src = assetUrl(album.cover)
    return
  }
  if (img.dataset.pagesThumb !== '1') {
    img.dataset.pagesThumb = '1'
    img.src = pagesCoverThumbUrl(album.cover)
    return
  }
  if (img.dataset.pagesOrig !== '1') {
    img.dataset.pagesOrig = '1'
    img.src = pagesAssetUrl(album.cover)
    return
  }
  coverFailedIds.value = new Set([...coverFailedIds.value, album.id])
}

// 点击卡片：挂载作品集并打开详情
function openLatestAlbum(album) {
  try {
    sessionStorage.setItem('gallery-open-album', album.id)
  } catch {
    /* 忽略 */
  }
  window.dispatchEvent(new CustomEvent('mount-gallery'))
  window.setTimeout(() => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
  }, 120)
}

function goFullGallery() {
  window.dispatchEvent(new CustomEvent('mount-gallery'))
  window.setTimeout(() => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
  }, 80)
}
</script>

<template>
  <section v-if="showBlock" id="latest-styles" class="latest-section section">
    <div class="container">
      <div id="gallery-latest" class="latest-anchor" aria-hidden="true" />
      <div class="latest-header">
        <span class="latest-label">NEW</span>
        <h2 class="latest-title">最新款式</h2>
        <p class="latest-desc">店主新上传的款式（最多展示 3 款）</p>
      </div>
      <div class="latest-grid">
        <GalleryAlbumCard
          v-for="album in latestAlbums"
          :key="album.id"
          :album="album"
          show-latest-badge
          :cover-failed="coverFailedIds.has(album.id)"
          :load-cover="shouldLoadCover()"
          :grid-cover-is-video="gridCoverIsVideo"
          :is-landscape="isLandscape"
          :is-cover-landscape-video="isCoverLandscapeVideo"
          @open="openLatestAlbum(album)"
          @cover-load="markLandscapeIfNeeded($event, 'cover-' + album.id)"
          @cover-error="onCoverImgError($event, album)"
        />
      </div>
      <button type="button" class="latest-more-btn" @click="goFullGallery">浏览全部作品集 ↓</button>
    </div>
  </section>
</template>

<style scoped>
.latest-section {
  padding-top: 48px;
  padding-bottom: 32px;
  background: linear-gradient(180deg, rgba(250, 246, 241, 0.6) 0%, transparent 100%);
}

.latest-anchor {
  scroll-margin-top: calc(var(--header-height) + 16px);
}

.latest-header {
  margin-bottom: 20px;
  text-align: center;
}

.latest-label {
  display: inline-block;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.latest-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.latest-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.latest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 720px;
  margin: 0 auto;
}

.latest-grid :deep(.gallery-item) {
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.latest-grid :deep(.gallery-img-wrap) {
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.latest-grid :deep(.gallery-media) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.latest-more-btn {
  display: block;
  margin: 24px auto 0;
  padding: 10px 22px;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.latest-more-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

@media (max-width: 640px) {
  .latest-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}
</style>
