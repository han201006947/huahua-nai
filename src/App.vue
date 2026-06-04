<script setup>
// 引入各页面区块组件
import { ref, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue'
import NavHeader from './components/NavHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ServiceSection from './components/ServiceSection.vue'
import LatestStylesSection from './components/LatestStylesSection.vue'
import ContactSection from './components/ContactSection.vue'
import AppFooter from './components/AppFooter.vue'

// 作品集：店主 #gallery 同步 import；顾客懒加载 chunk，首屏只出 Hero
const GallerySection = defineAsyncComponent(() => import('./components/GallerySection.vue'))

const AboutSection = defineAsyncComponent(() => import('./components/AboutSection.vue'))

// 作品集默认不挂载，减轻顾客/店主扫码首屏 JS 与图片并发
const showGallery = ref(false)
const showAbout = ref(false)
let belowFoldObserver = null

function mountGallery() {
  showGallery.value = true
}

// 带 #gallery 或店主登录参数：先出 Hero，idle 后再挂作品集（比同步 mount 快）
function scheduleGalleryMount(isAdminEntry = false) {
  if (showGallery.value) return
  const run = () => {
    showGallery.value = true
  }
  const idleTimeout = isAdminEntry ? 900 : 600
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: idleTimeout })
  } else {
    window.setTimeout(run, isAdminEntry ? 350 : 200)
  }
}

// 锚点 #gallery：作品集挂上后滚到网格（店主码 URL 自带此 hash）
watch(showGallery, (visible) => {
  if (!visible || !window.location.hash.includes('gallery')) return
  nextTick(() => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
})

onMounted(() => {
  window.addEventListener('mount-gallery', mountGallery)

  const params = new URLSearchParams(window.location.search)
  const isAdminEntry = params.has('adminLogin')
  const hashGallery = window.location.hash.includes('gallery')
  if (isAdminEntry || hashGallery) {
    scheduleGalleryMount(isAdminEntry)
  }

  // 顾客首页：不自动挂作品集，滚到下方或点按钮再加载
  const sentinel = document.getElementById('below-fold-sentinel')
  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    belowFoldObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) mountGallery()
      },
      { rootMargin: '200px' }
    )
    belowFoldObserver.observe(sentinel)
  }

  const mountAbout = () => {
    showAbout.value = true
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(mountAbout, { timeout: 3000 })
  } else {
    setTimeout(mountAbout, 2000)
  }
})

onUnmounted(() => {
  window.removeEventListener('mount-gallery', mountGallery)
  belowFoldObserver?.disconnect()
})
</script>

<template>
  <NavHeader />
  <main>
    <HeroSection />
    <ServiceSection />
    <LatestStylesSection />
    <div id="below-fold-sentinel" class="below-fold-sentinel" aria-hidden="true" />
    <GallerySection v-if="showGallery" />
    <AboutSection v-if="showAbout" />
    <ContactSection />
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  padding-top: 0;
}

.below-fold-sentinel {
  height: 1px;
  margin-top: -1px;
  pointer-events: none;
}
</style>
