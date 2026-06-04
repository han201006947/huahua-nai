<script setup>
// 作品集网格单卡（主网格与「最新款式」共用）
import { STYLE_PREVIEW_LABEL } from '../data/galleryAlbums.js'
import { coverThumbUrl } from '../utils/assetUrl.js'

const props = defineProps({
  album: { type: Object, required: true },
  // 是否显示「最新款式」角标
  showLatestBadge: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  deletingAlbumId: { type: String, default: '' },
  coverFailed: { type: Boolean, default: false },
  loadCover: { type: Boolean, default: true },
  gridCoverIsVideo: { type: Function, required: true },
  isLandscape: { type: Function, required: true },
  isCoverLandscapeVideo: { type: Function, required: true },
})

const emit = defineEmits(['open', 'delete', 'cover-load', 'cover-error'])
</script>

<template>
  <figure
    class="gallery-item is-clickable"
    :data-album-id="album.id"
    @click="emit('open')"
  >
    <div
      class="gallery-img-wrap"
      :class="{
        'is-landscape': !album.coverVideo && !album.videoOnly && isLandscape('cover-' + album.id),
        'is-landscape-video': isCoverLandscapeVideo(album),
      }"
    >
      <div
        v-if="gridCoverIsVideo(album)"
        class="gallery-media gallery-video-placeholder"
        aria-hidden="true"
      >
        <span class="gallery-video-ph-icon">▶</span>
      </div>
      <div v-if="coverFailed" class="gallery-media gallery-cover-missing" aria-hidden="true">
        <span>暂无图片</span>
      </div>
      <!-- 封面尚未请求时显示占位，避免空白闪烁 -->
      <div
        v-else-if="!loadCover && !gridCoverIsVideo(album)"
        class="gallery-media gallery-cover-skeleton"
        aria-hidden="true"
      />
      <img
        v-else-if="!gridCoverIsVideo(album)"
        class="gallery-media"
        :src="loadCover ? coverThumbUrl(album.cover) : undefined"
        alt=""
        loading="lazy"
        decoding="async"
        @load="emit('cover-load', $event)"
        @error="emit('cover-error', $event)"
      />
      <span v-if="showLatestBadge" class="latest-style-badge">最新款式</span>
      <span v-if="album.hasVideo" class="video-badge">▶ 含视频</span>
      <div v-if="album.stylePreview" class="style-preview-badge">
        <span class="spb-en">{{ STYLE_PREVIEW_LABEL.badgeEn }}</span>
        <span class="spb-zh">{{ STYLE_PREVIEW_LABEL.badgeZh }}</span>
      </div>
      <div class="gallery-overlay">
        <span class="gallery-cat">{{ album.category }}</span>
        <h3 class="gallery-title">{{ album.title }}</h3>
        <span class="gallery-hint">点击查看详情</span>
      </div>
      <button
        v-if="canManage"
        type="button"
        class="gallery-delete-btn"
        :disabled="deletingAlbumId === album.id"
        aria-label="删除款式"
        @click.stop="emit('delete')"
      >
        {{ deletingAlbumId === album.id ? '删除中…' : '删除' }}
      </button>
    </div>
  </figure>
</template>

<style scoped>
/* 封面懒加载前的浅色占位，避免空白格 */
.gallery-cover-skeleton {
  width: 100%;
  height: 100%;
  min-height: 120px;
  background: linear-gradient(110deg, #ece4dc 8%, #f5f0ea 18%, #ece4dc 33%);
  background-size: 200% 100%;
  animation: gallery-cover-shimmer 1.2s ease-in-out infinite;
}

@keyframes gallery-cover-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.gallery-cover-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 120px;
  background: #ece4dc;
  color: #8a7a72;
  font-size: 0.75rem;
}
</style>
