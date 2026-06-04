<script setup>
// 详情内视频：先显示 poster +「点击播放」，用户点击后再挂 src，避免打开弹层就下载 mp4
import { ref, computed, watch, nextTick } from 'vue'
import { assetUrl, videoPosterUrl } from '../utils/assetUrl.js'

const props = defineProps({
  // 视频相对路径，如 ./maoyan/m1/m11.mp4
  src: { type: String, required: true },
})

// 向父组件上报宽高，用于横屏布局
const emit = defineEmits(['loadedmetadata'])

const videoEl = ref(null)
// 是否已开始加载（用户点击播放后）
const started = ref(false)
// 正在缓冲首帧
const buffering = ref(false)

// 构建后的首帧封面（无 build 时为空，用占位）
const poster = computed(() => videoPosterUrl(props.src))

// 仅在用户点击后才赋值，避免 <video src> 提前触发下载
const videoSrc = computed(() => (started.value ? assetUrl(props.src) : ''))

// 换款式/关闭弹层时重置
watch(
  () => props.src,
  () => {
    started.value = false
    buffering.value = false
  }
)

// 用户点击播放：挂上地址并尝试自动播放
async function onPlayTap() {
  if (started.value) return
  started.value = true
  buffering.value = true
  await nextTick()
  const el = videoEl.value
  if (!el) {
    buffering.value = false
    return
  }
  el.load()
  try {
    await el.play()
  } catch {
    // 部分浏览器需用户再点 controls，忽略即可
  }
}

function onCanPlay() {
  buffering.value = false
}

function onWaiting() {
  if (started.value) buffering.value = true
}

function onLoadedMeta(event) {
  buffering.value = false
  emit('loadedmetadata', event)
}
</script>

<template>
  <div class="gallery-detail-video" @click.stop>
    <!-- 未播放：封面 + 大播放钮（几乎瞬间显示） -->
    <div v-if="!started" class="gallery-detail-video-idle">
      <img
        v-if="poster"
        class="gallery-detail-video-poster"
        :src="poster"
        alt=""
        decoding="async"
      />
      <div v-else class="gallery-detail-video-ph" aria-hidden="true">
        <span class="gallery-detail-video-ph-icon">▶</span>
      </div>
      <button type="button" class="gallery-detail-video-play" @click="onPlayTap">
        点击播放
      </button>
    </div>
    <!-- 已开始：video 才带 src；缓冲时叠一层提示 -->
    <video
      v-show="started"
      ref="videoEl"
      class="gallery-detail-video-el"
      :src="videoSrc"
      :poster="poster || undefined"
      controls
      playsinline
      preload="none"
      @canplay="onCanPlay"
      @waiting="onWaiting"
      @loadedmetadata="onLoadedMeta"
    />
    <p v-if="started && buffering" class="gallery-detail-video-loading">正在加载视频…</p>
  </div>
</template>

<style scoped>
.gallery-detail-video {
  position: relative;
  width: 100%;
  min-height: 160px;
  background: #1a120e;
  border-radius: 8px;
  overflow: hidden;
}

.gallery-detail-video-idle {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-detail-video-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-detail-video-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #2a2018, #1a120e);
}

.gallery-detail-video-ph-icon {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.85);
}

.gallery-detail-video-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 999px;
  background: rgba(92, 64, 51, 0.92);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.gallery-detail-video-el {
  width: 100%;
  display: block;
  max-height: 70vh;
  background: #000;
}

.gallery-detail-video-loading {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.5rem;
  margin: 0;
  text-align: center;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
</style>
