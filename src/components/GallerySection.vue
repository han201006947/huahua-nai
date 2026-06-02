<script setup>
// 从 vue 引入响应式 API 与生命周期
import { ref, computed, onMounted, onUnmounted } from 'vue'
// 引入按文件夹组织的相册数据与穿戴甲贴手示意文案
import { galleryAlbums, STYLE_PREVIEW_LABEL } from '../data/galleryAlbums.js'
// 静态资源相对路径，兼容 GitHub Pages 子目录与离线包
import { assetUrl } from '../utils/assetUrl.js'

// 当前筛选分类，空字符串表示全部
const activeCategory = ref('')

// 当前打开的相册（null 表示未打开详情）
const activeAlbum = ref(null)

// 图片放大预览地址（null 表示未放大）
const lightboxSrc = ref(null)

// 单图相册直接放大时，记录来源相册以便展示穿戴甲贴手说明
const lightboxAlbum = ref(null)

// 横屏媒体 key 集合（宽>高时旋转 90° 展示）
const landscapeKeys = ref(new Set())

// 检测封面/详情图是否为横屏，横屏则加入集合
function markLandscapeIfNeeded(event, key) {
  const el = event.target
  const w = el.naturalWidth || el.videoWidth || 0
  const h = el.naturalHeight || el.videoHeight || 0
  if (w > h) {
    landscapeKeys.value = new Set([...landscapeKeys.value, key])
  }
}

// 判断某媒体是否已标记为横屏
function isLandscape(key) {
  return landscapeKeys.value.has(key)
}

// 详情弹层是否用窄单列（单张竖图/竖视频）；横屏视频走宽屏 16:9
function useSingleColumnLayout(album) {
  if (!album || album.media.length !== 1) return false
  const item = album.media[0]
  const key = `detail-${album.id}-0`
  if (item.type === 'video' && isLandscape(key)) return false
  return true
}

// 详情是否为单条横屏视频（纯视频相册等）
function isSingleLandscapeVideo(album) {
  if (!album || album.media.length !== 1) return false
  const item = album.media[0]
  if (item.type !== 'video') return false
  return isLandscape(`detail-${album.id}-0`)
}

// 封面是否为横屏视频（与横屏图片区分，视频不旋转）
function isCoverLandscapeVideo(album) {
  if (!album.coverVideo && !album.videoOnly) return false
  return isLandscape(`cover-${album.id}`)
}

// 提取所有不重复的分类标签
const categories = computed(() => {
  const set = new Set(galleryAlbums.map((item) => item.category))
  return ['全部', ...set]
})

// 根据选中分类过滤相册
const filteredAlbums = computed(() => {
  if (!activeCategory.value || activeCategory.value === '全部') {
    return galleryAlbums
  }
  return galleryAlbums.filter((item) => item.category === activeCategory.value)
})

// 切换分类筛选
function setCategory(cat) {
  activeCategory.value = cat
}

// 锁定页面滚动
function lockScroll() {
  document.body.style.overflow = 'hidden'
}

// 恢复页面滚动
function unlockScroll() {
  document.body.style.overflow = ''
}

// 打开相册：纯图片且仅一张时直接放大，否则打开详情弹层
function openAlbum(album) {
  const images = album.media.filter((m) => m.type === 'image')
  if (!album.hasVideo && images.length === 1) {
    lightboxSrc.value = images[0].src
    lightboxAlbum.value = album.stylePreview ? album : null
    lockScroll()
    return
  }
  activeAlbum.value = album
  lockScroll()
}

// 关闭相册详情
function closeAlbum() {
  activeAlbum.value = null
  lightboxSrc.value = null
  lightboxAlbum.value = null
  unlockScroll()
}

// 点击图片放大预览
function openLightbox(src) {
  lightboxSrc.value = src
}

// 关闭放大预览（保留相册弹层）
function closeLightbox() {
  lightboxSrc.value = null
  if (!activeAlbum.value) {
    lightboxAlbum.value = null
    unlockScroll()
  }
}

// Esc：先关放大，再关相册
function onKeydown(event) {
  if (event.key !== 'Escape') return
  if (lightboxSrc.value) {
    closeLightbox()
    return
  }
  if (activeAlbum.value) {
    closeAlbum()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  unlockScroll()
})
</script>

<template>
  <!-- 作品展示区块 -->
  <section id="gallery" class="gallery section">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Portfolio</span>
        <h2 class="section-title">指尖艺术作品集</h2>
        <p class="section-desc">
          每一款设计都是匠心之作，点击作品可查看该款式下的照片与视频。
        </p>
      </div>

      <!-- 分类筛选标签 -->
      <div class="filter-bar">
        <button
          v-for="cat in categories"
          :key="cat"
          class="filter-btn"
          :class="{ active: activeCategory === cat || (!activeCategory && cat === '全部') }"
          @click="setCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>

      <!-- 相册封面网格 -->
      <div class="gallery-grid">
        <figure
          v-for="album in filteredAlbums"
          :key="album.id"
          class="gallery-item is-clickable"
          @click="openAlbum(album)"
        >
          <div
            class="gallery-img-wrap"
            :class="{
              'is-landscape': !album.coverVideo && !album.videoOnly && isLandscape('cover-' + album.id),
              'is-landscape-video': isCoverLandscapeVideo(album),
            }"
          >
            <!-- 纯视频相册：封面仅展示首帧，preload=none 避免网格里预拉整段 mp4 -->
            <video
              v-if="album.coverVideo || album.videoOnly"
              class="gallery-media"
              :src="assetUrl(album.coverVideo || album.cover)"
              muted
              playsinline
              preload="none"
              @loadedmetadata="markLandscapeIfNeeded($event, 'cover-' + album.id)"
            />
            <img
              v-else
              class="gallery-media"
              :src="assetUrl(album.cover)"
              :alt="album.title"
              loading="lazy"
              decoding="async"
              @load="markLandscapeIfNeeded($event, 'cover-' + album.id)"
            />
            <span v-if="album.hasVideo" class="video-badge">▶ 含视频</span>
            <!-- 穿戴甲贴手角标：戴手仅看款式，常驻左上角 -->
            <div v-if="album.stylePreview" class="style-preview-badge">
              <span class="spb-en">{{ STYLE_PREVIEW_LABEL.badgeEn }}</span>
              <span class="spb-zh">{{ STYLE_PREVIEW_LABEL.badgeZh }}</span>
            </div>
            <div class="gallery-overlay">
              <span class="gallery-cat">{{ album.category }}</span>
              <h3 class="gallery-title">{{ album.title }}</h3>
              <span class="gallery-hint">点击查看详情</span>
            </div>
          </div>
        </figure>
      </div>
    </div>

    <!-- 相册详情弹层：三列横排展示照片与视频 -->
    <Teleport to="body">
      <div
        v-if="activeAlbum"
        class="album-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="activeAlbum.title"
        @click.self="closeAlbum"
      >
        <div class="album-panel">
          <button type="button" class="album-close" aria-label="关闭" @click="closeAlbum">
            ×
          </button>
          <header class="album-header">
            <span class="album-cat">{{ activeAlbum.category }}</span>
            <h3 class="album-title">{{ activeAlbum.title }}</h3>
            <!-- 详情弹层顶部说明：穿戴甲贴手仅看款式 -->
            <p v-if="activeAlbum.stylePreview" class="album-style-notice">
              <span class="asn-accent">{{ STYLE_PREVIEW_LABEL.badgeEn }}</span>
              <span class="asn-text">{{ STYLE_PREVIEW_LABEL.notice }}</span>
            </p>
          </header>
          <div
            class="album-media-list"
            :class="{
              'is-single': useSingleColumnLayout(activeAlbum),
              'is-single-landscape-video': isSingleLandscapeVideo(activeAlbum),
            }"
          >
            <div
              v-for="(item, index) in activeAlbum.media"
              :key="index"
              class="album-media-item"
              :class="[
                item.type === 'video' ? 'is-video' : 'is-image',
                {
                  'is-landscape': item.type === 'image' && isLandscape('detail-' + activeAlbum.id + '-' + index),
                  'is-landscape-video': item.type === 'video' && isLandscape('detail-' + activeAlbum.id + '-' + index),
                },
              ]"
            >
              <!-- 图片：点击放大，横屏自动旋转 -->
              <img
                v-if="item.type === 'image'"
                :src="assetUrl(item.src)"
                :alt="`${activeAlbum.title} 图片 ${index + 1}`"
                loading="lazy"
                @load="markLandscapeIfNeeded($event, 'detail-' + activeAlbum.id + '-' + index)"
                @click="openLightbox(item.src)"
              />
              <!-- 视频：横屏占两格，网格内直接播放 -->
              <video
                v-else
                :src="assetUrl(item.src)"
                controls
                playsinline
                preload="metadata"
                @loadedmetadata="markLandscapeIfNeeded($event, 'detail-' + activeAlbum.id + '-' + index)"
                @click.stop
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 图片放大层 -->
      <div
        v-if="lightboxSrc"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        @click="closeLightbox"
      >
        <button type="button" class="lightbox-close" aria-label="关闭" @click.stop="closeLightbox">
          ×
        </button>
        <img
          :src="assetUrl(lightboxSrc)"
          alt="放大预览"
          :class="{ 'is-landscape': isLandscape('lightbox-' + lightboxSrc) }"
          @load="markLandscapeIfNeeded($event, 'lightbox-' + lightboxSrc)"
          @click.stop
        />
        <!-- 放大层底部说明：穿戴甲贴手仅看款式 -->
        <p
          v-if="activeAlbum?.stylePreview || lightboxAlbum?.stylePreview"
          class="lightbox-style-note"
        >
          <span class="asn-accent">{{ STYLE_PREVIEW_LABEL.badgeEn }}</span>
          <span class="asn-text">{{ STYLE_PREVIEW_LABEL.notice }}</span>
        </p>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 40px;
}

.filter-btn {
  padding: 8px 20px;
  border: 1.5px solid rgba(201, 168, 124, 0.3);
  border-radius: 999px;
  background: transparent;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.gallery-item {
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.gallery-item.is-clickable {
  cursor: pointer;
}

.gallery-img-wrap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  aspect-ratio: 4 / 5;
}

.gallery-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

/* 视频封面与图片同等裁切展示 */
.gallery-img-wrap video.gallery-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  pointer-events: none;
}

/* 横屏封面/图片：旋转 90° 后按高度铺满竖向卡片 */
.gallery-img-wrap.is-landscape .gallery-media {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 100%;
  width: auto;
  max-width: none;
  transform: translate(-50%, -50%) rotate(90deg);
}

/* 横屏视频封面：不旋转，居中完整展示 */
.gallery-img-wrap.is-landscape-video .gallery-media {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
}

.gallery-item:hover .gallery-img-wrap:not(.is-landscape):not(.is-landscape-video) .gallery-media {
  transform: scale(1.06);
}

.gallery-item:hover .gallery-img-wrap.is-landscape .gallery-media {
  transform: translate(-50%, -50%) rotate(90deg) scale(1.06);
}

.gallery-item:hover .gallery-img-wrap.is-landscape-video .gallery-media {
  transform: translate(-50%, -50%) scale(1.06);
}

.video-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  background: rgba(61, 44, 46, 0.75);
  color: var(--color-white);
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
  pointer-events: none;
}

/* 穿戴甲贴手角标：毛玻璃 + 金色细线，常驻封面左上角 */
.style-preview-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 11px;
  background: rgba(61, 44, 46, 0.42);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(201, 168, 124, 0.65);
  border-radius: 4px;
  pointer-events: none;
}

.spb-en {
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  color: rgba(201, 168, 124, 0.95);
  line-height: 1.3;
}

.spb-zh {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.3;
}

/* 详情弹层与放大层共用说明条样式 */
.album-style-notice,
.lightbox-style-note {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  margin-top: 14px;
  padding: 10px 14px;
  border-left: 2px solid var(--color-primary);
  background: rgba(201, 168, 124, 0.08);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.asn-accent {
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  color: var(--color-primary);
}

.asn-text {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

.lightbox-style-note {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0;
  max-width: min(520px, 90vw);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-left-color: rgba(201, 168, 124, 0.85);
}

.lightbox-style-note .asn-accent {
  color: rgba(201, 168, 124, 0.95);
}

.lightbox-style-note .asn-text {
  color: rgba(255, 255, 255, 0.88);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(61, 44, 46, 0.75) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-cat {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-accent);
  text-transform: uppercase;
}

.gallery-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-white);
  margin-top: 4px;
}

.gallery-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8px;
}

.album-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(61, 44, 46, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.album-panel {
  position: relative;
  width: min(1080px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  box-shadow: var(--shadow-soft);
}

.album-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(201, 168, 124, 0.15);
  color: var(--color-text);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s;
}

.album-close:hover {
  background: rgba(201, 168, 124, 0.28);
}

.album-header {
  margin-bottom: 24px;
  padding-right: 40px;
}

.album-cat {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-primary);
}

.album-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-text);
  margin-top: 6px;
}

/* 详情内三列横排，图片与视频同等网格 */
.album-media-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 纯视频或单条竖向媒体：单列窄展示 */
.album-media-list.is-single {
  grid-template-columns: 1fr;
  max-width: 560px;
  margin: 0 auto;
}

/* 单条横屏视频（如猫眼星辰 9）：全宽 16:9，不占窄竖格 */
.album-media-list.is-single-landscape-video {
  grid-template-columns: 1fr;
  max-width: 100%;
  margin: 0;
}

.album-media-list.is-single-landscape-video .album-media-item.is-landscape-video {
  grid-column: span 1;
}

.album-media-list.is-single-landscape-video video {
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #1a1416;
  max-height: min(72vh, 640px);
}

.album-media-item {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-soft);
}

.album-media-item img,
.album-media-item video {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

/* 详情内横屏图：同样旋转 90° 适配竖向格子 */
.album-media-item.is-landscape img {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 100%;
  width: auto;
  max-width: none;
  aspect-ratio: unset;
  transform: translate(-50%, -50%) rotate(90deg);
}

.album-media-item.is-landscape {
  aspect-ratio: 4 / 5;
}

/* 详情内横屏视频：跨两列，16:9 比例完整展示 */
.album-media-item.is-landscape-video {
  grid-column: span 2;
}

.album-media-item.is-landscape-video video {
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #1a1416;
}

/* 放大层横屏图旋转展示 */
.lightbox img.is-landscape {
  transform: rotate(90deg);
  max-height: min(960px, 92vw);
  max-width: 90vh;
  width: auto;
  height: auto;
}

/* 图片可点击放大 */
.album-media-item.is-image {
  cursor: zoom-in;
}

.album-media-item.is-image img:hover {
  opacity: 0.92;
}

/* 图片放大层 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.lightbox img {
  max-width: min(960px, 92vw);
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}

@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .album-media-list {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 小屏横屏视频仍占满一行两格 */
  .album-media-item.is-landscape-video {
    grid-column: span 2;
  }

  .album-panel {
    padding: 24px 16px;
  }
}
</style>
