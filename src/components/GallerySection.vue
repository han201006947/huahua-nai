<script setup>
// 从 vue 引入响应式 API 与生命周期
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
// 引入穿戴甲贴手示意文案
import { STYLE_PREVIEW_LABEL } from '../data/galleryAlbums.js'
// 作品集列表：开发态可热更新
import { useGalleryAlbums } from '../composables/useGalleryAlbums.js'
// 店主登录后才可管理
import { useAdminAuth } from '../composables/useAdminAuth.js'
// 本地 dev 删除款式 API
import {
  readFileAsBase64,
  requestAddAlbumMedia,
  requestDeleteAlbum,
  requestDeleteAlbumMedia,
} from '../composables/useGalleryAdminApi.js'
// 多标签/多窗口实时同步作品集
import { notifyGallerySync, useGallerySyncListener } from '../composables/useGallerySync.js'
// 静态资源相对路径，兼容 GitHub Pages 子目录与离线包
import { assetUrl, coverThumbUrl, ownerMasterFallbackUrl } from '../utils/assetUrl.js'

// 相册数据与 reload（仅 dev 走 API）
const { albums, categoryOptions, reloadAlbums, reloadCategories, refreshCustomerAlbums, isDev } = useGalleryAlbums()

// 店主 session（扫码登录；main.js 已提前 initAdminAuth）
const { isAdminLoggedIn, isOnlineAdminMode, isOwnerGalleryPreview } = useAdminAuth()

// 是否允许管理/删除（已登录即可，线上与本地 dev 均可用）
const canManage = computed(() => isAdminLoggedIn.value)

// 管理面板（线上 build 含此组件，仅登录后显示）
const GalleryAdminPanel = defineAsyncComponent(() => import('./GalleryAdminPanel.vue'))

// 管理面板是否展开（登录后默认展开）
const adminPanelOpen = ref(false)

// 正在删除的相册 id（防止重复点击）
const deletingAlbumId = ref('')

// 详情弹层内媒体操作进行中
const mediaActionBusy = ref(false)

// 详情内追加媒体的文件选择器
const albumMediaInput = ref(null)

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

// 已进入视口的相册 id：未到视口不请求缩略图
const visibleAlbumIds = ref(new Set())

// 增删后递增，强制作品集网格整体重绘
const galleryListKey = ref(0)

let galleryObserver = null

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

// 提取所有不重复的分类标签（含尚无款式的空分类）
const categories = computed(() => {
  const set = new Set()
  for (const c of categoryOptions.value) set.add(c.category)
  for (const item of albums.value) set.add(item.category)
  return ['全部', ...set]
})

// 根据选中分类过滤相册
const filteredAlbums = computed(() => {
  if (!activeCategory.value || activeCategory.value === '全部') {
    return albums.value
  }
  return albums.value.filter((item) => item.category === activeCategory.value)
})

// 网格封面是否为纯视频（不在列表里预加载 mp4，点开详情再看）
function gridCoverIsVideo(album) {
  return /\.(mp4|webm|mov)$/i.test(album.cover || '')
}

// 相册封面缩略图是否应开始加载（店主登录后直接加载，避免懒加载空白）
function shouldLoadCover(album) {
  if (gridCoverIsVideo(album)) return false
  if (isDev || isAdminLoggedIn.value) return true
  return visibleAlbumIds.value.has(album.id)
}

// 封面图加载失败 id 集合（显示占位而不重复 alt 文字）
const coverFailedIds = ref(new Set())

// 封面加载失败：店主先回退 master；再试 gh-pages 原图
function onCoverImgError(event, album) {
  const img = event.target
  // 店主：gh-pages 尚无缩略图时回退 master（新款式 deploy 前）
  if (isOwnerGalleryPreview() && img.dataset.masterFallback !== '1') {
    img.dataset.masterFallback = '1'
    img.src = ownerMasterFallbackUrl(album.cover)
    return
  }
  const fallback = assetUrl(album.cover)
  if (img.dataset.fallback === '1') {
    coverFailedIds.value = new Set([...coverFailedIds.value, album.id])
    return
  }
  if (!fallback || img.src === fallback) {
    coverFailedIds.value = new Set([...coverFailedIds.value, album.id])
    return
  }
  img.dataset.fallback = '1'
  img.src = fallback
}

// 详情/灯箱内图片加载失败：店主回退 master
function onMediaImgError(event, srcPath) {
  const img = event.target
  if (!isOwnerGalleryPreview() || img.dataset.masterFallback === '1') return
  img.dataset.masterFallback = '1'
  img.src = ownerMasterFallbackUrl(srcPath)
}

// 绑定作品集网格 IntersectionObserver，并重置视口内封面加载状态
function bindGalleryObserver() {
  if (galleryObserver) galleryObserver.disconnect()
  const immediatelyVisible = new Set()
  galleryObserver = new IntersectionObserver(
    (entries) => {
      const next = new Set(visibleAlbumIds.value)
      for (const entry of entries) {
        const id = entry.target.getAttribute('data-album-id')
        if (!id) continue
        if (entry.isIntersecting) next.add(id)
        else next.delete(id)
      }
      visibleAlbumIds.value = next
    },
    { rootMargin: '160px', threshold: 0.01 }
  )
  const viewportH = window.innerHeight || document.documentElement.clientHeight
  document.querySelectorAll('.gallery-item[data-album-id]').forEach((el) => {
    galleryObserver.observe(el)
    // 删款后重绑时，已在屏幕内的卡片立刻恢复封面（避免空白）
    const rect = el.getBoundingClientRect()
    if (rect.bottom >= -160 && rect.top <= viewportH + 160) {
      const id = el.getAttribute('data-album-id')
      if (id) immediatelyVisible.add(id)
    }
  })
  visibleAlbumIds.value = immediatelyVisible
}

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

// 店主增删后刷新图片 CDN 缓存戳（jsDelivr master 用）
function bumpGalleryMediaBust() {
  try {
    sessionStorage.setItem('gallery-media-bust', String(Date.now()))
  } catch {
    /* 忽略 */
  }
}

// 顾客从其它 App 返回时拉最新列表
function onCustomerVisibilityRefresh() {
  if (document.visibilityState === 'visible') refreshCustomerAlbums()
}

// 顾客页定时拉最新 galleryAlbums（店主删款后无需等 Actions）
let customerPollTimer = null

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  // 顾客：打开/返回页面时拉 GitHub 最新 galleryAlbums（不依赖旧 app.js 打包）
  if (isOnlineAdminMode() && !isAdminLoggedIn.value) {
    refreshCustomerAlbums()
    document.addEventListener('visibilitychange', onCustomerVisibilityRefresh)
    customerPollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshCustomerAlbums()
    }, 45000)
  }
  // dev 删款 reload 后滚回作品集区域
  if (isDev && sessionStorage.getItem('gallery-scroll-restore') === '1') {
    sessionStorage.removeItem('gallery-scroll-restore')
    nextTick(() => {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
  }
  nextTick(() => bindGalleryObserver())
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('visibilitychange', onCustomerVisibilityRefresh)
  if (customerPollTimer) window.clearInterval(customerPollTimer)
  galleryObserver?.disconnect()
  unlockScroll()
})

// 店主登录完成后（含扫码后 initAdminAuth）再拉管理数据；顾客不请求 GitHub
watch(
  isAdminLoggedIn,
  (loggedIn) => {
    if (!loggedIn || (!isDev && !isOnlineAdminMode())) return
    adminPanelOpen.value = true
    reloadCategories().catch(() => {})
    reloadAlbums().catch(() => {})
    if (window.location.hash.includes('gallery')) {
      nextTick(() => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
    }
  },
  { immediate: true }
)

watch(filteredAlbums, () => {
  nextTick(() => bindGalleryObserver())
})

// 其他标签/窗口增删后，本页作品集与管理区同步刷新
useGallerySyncListener(() => onGalleryAdminChanged(true))

// 分类 Tab 变化后校正筛选（删分类时避免网格被空筛选卡住）
function syncActiveCategoryFilter() {
  const names = categories.value
  if (!activeCategory.value || activeCategory.value === '全部') return
  if (!names.includes(activeCategory.value)) activeCategory.value = ''
}

// 本地管理增删后刷新列表、分类 Tab 与懒加载（arg=true 为跨窗口广播；否则为 payload）
async function onGalleryAdminChanged(arg) {
  const fromBroadcast = arg === true
  const payload = fromBroadcast ? null : arg
  if (activeAlbum.value) closeAlbum()
  if (lightboxSrc.value) closeLightbox()
  landscapeKeys.value = new Set()
  coverFailedIds.value = new Set()
  try {
    // 注意：空数组也是合法列表（删光某分类时），不能用 length 判断
    if (Array.isArray(payload?.albums)) {
      let next = [...payload.albums]
      if (payload.removedAlbumId) {
        next = next.filter((a) => a.id !== payload.removedAlbumId)
      }
      albums.value = next
      await reloadCategories()
    } else {
      await Promise.all([reloadAlbums(), reloadCategories()])
    }
  } catch (e) {
    window.alert(e.message || String(e))
  }
  if (payload && 'category' in payload) activeCategory.value = payload.category
  syncActiveCategoryFilter()
  galleryListKey.value += 1
  await nextTick()
  bindGalleryObserver()
  bumpGalleryMediaBust()
  if (!fromBroadcast) notifyGallerySync()
}

// 详情内增删媒体后刷新弹层与网格
async function applyMediaChangeResult(data) {
  albums.value = [...(data.albums || [])]
  galleryListKey.value += 1
  await reloadCategories()
  const updated = albums.value.find((a) => a.id === data.albumId)
  if (updated) activeAlbum.value = { ...updated }
  else closeAlbum()
  await nextTick()
  bindGalleryObserver()
  bumpGalleryMediaBust()
  notifyGallerySync()
}

// 删除详情内单张图/单个视频
async function deleteAlbumMediaItem(item) {
  if (!activeAlbum.value || mediaActionBusy.value) return
  const label = item.type === 'video' ? '视频' : '图片'
  if (!window.confirm(`确定删除这个${label}？\n文件将从 public 中移除。`)) return
  mediaActionBusy.value = true
  try {
    const data = await requestDeleteAlbumMedia(activeAlbum.value.id, item.src)
    await applyMediaChangeResult(data)
  } catch (e) {
    window.alert(e.message || String(e))
  } finally {
    mediaActionBusy.value = false
  }
}

// 触发详情内选择文件
function pickAlbumMediaFiles() {
  albumMediaInput.value?.click()
}

// 详情内追加图片/视频
async function onAlbumMediaPicked(event) {
  const list = event.target.files
  if (!activeAlbum.value || !list?.length) return
  mediaActionBusy.value = true
  try {
    const files = []
    for (const file of list) {
      files.push({ name: file.name, data: await readFileAsBase64(file) })
    }
    const data = await requestAddAlbumMedia(activeAlbum.value.id, files)
    await applyMediaChangeResult(data)
  } catch (e) {
    window.alert(e.message || String(e))
  } finally {
    mediaActionBusy.value = false
    event.target.value = ''
  }
}

// 点击卡片右下角删除（店主登录后可见）
async function deleteAlbumFromGrid(album) {
  if (!window.confirm(`确定删除「${album.title}」？\n将删除 public 内对应图片/视频，且不可恢复。`)) return
  const removedId = album.id
  deletingAlbumId.value = removedId
  const snapshot = [...albums.value]
  // 乐观更新：确认后立刻从网格移除，避免留空白卡片
  albums.value = snapshot.filter((a) => a.id !== removedId)
  galleryListKey.value += 1
  await nextTick()
  bindGalleryObserver()
  try {
    const data = await requestDeleteAlbum(removedId)
    notifyGallerySync()
    if (isOnlineAdminMode()) {
      const next = (data.albums || []).filter((a) => a.id !== removedId)
      await onGalleryAdminChanged({
        albums: next,
        category: album.category,
        removedAlbumId: removedId,
      })
      deletingAlbumId.value = ''
      return
    }
    sessionStorage.setItem('gallery-scroll-restore', '1')
    window.location.reload()
  } catch (e) {
    albums.value = snapshot
    galleryListKey.value += 1
    await nextTick()
    bindGalleryObserver()
    window.alert(e.message || String(e))
    deletingAlbumId.value = ''
  }
}
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

      <!-- dev：已登录才显示管理面板；未登录不展示任何说明文字，店主用二维码扫码登录 -->
      <GalleryAdminPanel
        v-if="canManage"
        v-model:open="adminPanelOpen"
        @changed="onGalleryAdminChanged"
      />

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

      <!-- 相册封面网格（key 随增删变化，避免删后仍显示旧卡片） -->
      <div :key="galleryListKey" class="gallery-grid">
        <figure
          v-for="album in filteredAlbums"
          :key="album.id"
          class="gallery-item is-clickable"
          :data-album-id="album.id"
          @click="openAlbum(album)"
        >
          <div
            class="gallery-img-wrap"
            :class="{
              'is-landscape': !album.coverVideo && !album.videoOnly && isLandscape('cover-' + album.id),
              'is-landscape-video': isCoverLandscapeVideo(album),
            }"
          >
            <!-- 纯视频封面：网格只显示占位，避免下载几十 MB 的 mp4 -->
            <div
              v-if="gridCoverIsVideo(album)"
              class="gallery-media gallery-video-placeholder"
              aria-hidden="true"
            >
              <span class="gallery-video-ph-icon">▶</span>
            </div>
            <!-- 封面缺失占位（文件已删或路径错误时不显示重复标题） -->
            <div
              v-if="coverFailedIds.has(album.id)"
              class="gallery-media gallery-cover-missing"
              aria-hidden="true"
            >
              <span>暂无图片</span>
            </div>
            <img
              v-else-if="!gridCoverIsVideo(album)"
              class="gallery-media"
              :src="shouldLoadCover(album) ? coverThumbUrl(album.cover) : undefined"
              alt=""
              loading="lazy"
              decoding="async"
              @load="markLandscapeIfNeeded($event, 'cover-' + album.id)"
              @error="onCoverImgError($event, album)"
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
            <!-- 本地 dev：右下角删除（无需先展开管理面板） -->
            <button
              v-if="canManage"
              type="button"
              class="gallery-delete-btn"
              :disabled="deletingAlbumId === album.id"
              aria-label="删除款式"
              @click.stop="deleteAlbumFromGrid(album)"
            >
              {{ deletingAlbumId === album.id ? '删除中…' : '删除' }}
            </button>
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
              :key="item.src"
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
                @error="onMediaImgError($event, item.src)"
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
              <!-- 本地 dev：删除单张图/视频 -->
              <button
                v-if="canManage"
                type="button"
                class="album-media-del"
                :disabled="mediaActionBusy"
                aria-label="删除此媒体"
                @click.stop="deleteAlbumMediaItem(item)"
              >
                删除
              </button>
            </div>
            <!-- 本地 dev：向当前款式追加媒体 -->
            <div v-if="canManage" class="album-media-add">
              <input
                ref="albumMediaInput"
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                @change="onAlbumMediaPicked"
              />
              <button
                type="button"
                class="album-media-add-btn"
                :disabled="mediaActionBusy"
                @click="pickAlbumMediaFiles"
              >
                {{ mediaActionBusy ? '处理中…' : '+ 添加图片 / 视频' }}
              </button>
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
          @error="onMediaImgError($event, lightboxSrc)"
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

/* 纯视频相册网格占位：不请求 mp4，仅显示播放图标 */
.gallery-video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f5ebe0 0%, #e8d5c4 100%);
}

.gallery-video-ph-icon {
  font-size: 2.5rem;
  color: rgba(120, 80, 50, 0.55);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* 封面文件缺失时的占位（避免 alt 文字顶在卡片上方） */
.gallery-cover-missing {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #efe6dc 0%, #d4c4b0 100%);
  color: rgba(92, 64, 51, 0.55);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
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

/* 本地 dev：卡片右下角删除，常驻可见 */
.gallery-delete-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 5;
  padding: 5px 12px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(180, 35, 24, 0.94);
  color: #fff;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
  pointer-events: auto;
}

.gallery-delete-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.gallery-delete-btn:hover:not(:disabled) {
  background: rgba(150, 25, 15, 0.95);
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

/* 详情内单媒体删除按钮 */
.album-media-del {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  background: rgba(180, 35, 24, 0.92);
  color: #fff;
  font-size: 0.72rem;
  cursor: pointer;
}

.album-media-del:disabled {
  opacity: 0.55;
  cursor: wait;
}

/* 详情内追加媒体 */
.album-media-add {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}

.album-media-add-btn {
  padding: 8px 16px;
  border: 1px dashed #c9a87c;
  border-radius: 8px;
  background: #fff8f0;
  color: #7a5230;
  font-size: 0.85rem;
  cursor: pointer;
}

.album-media-add-btn:disabled {
  opacity: 0.55;
  cursor: wait;
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
