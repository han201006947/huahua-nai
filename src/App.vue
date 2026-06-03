<script setup>
// 引入各页面区块组件
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import NavHeader from './components/NavHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ServiceSection from './components/ServiceSection.vue'
import ContactSection from './components/ContactSection.vue'
import AppFooter from './components/AppFooter.vue'
// 作品集进主包，避免扫码后再等异步 chunk
import GallerySection from './components/GallerySection.vue'

// 关于我们仍懒加载，减轻首包解析
const AboutSection = defineAsyncComponent(() => import('./components/AboutSection.vue'))

// 店主扫码 #gallery 或 adminLogin：立刻挂载作品集
function shouldMountGalleryImmediately() {
  if (typeof window === 'undefined') return false
  if (window.location.hash.includes('gallery')) return true
  return new URLSearchParams(window.location.search).has('adminLogin')
}

const showGallery = ref(shouldMountGalleryImmediately())
const showAbout = ref(false)
let belowFoldObserver = null

function mountGallery() {
  showGallery.value = true
}

onMounted(() => {
  window.addEventListener('mount-gallery', mountGallery)

  if (!showGallery.value) {
    const isOnline = typeof __GITHUB_REPO__ !== 'undefined' && Boolean(__GITHUB_REPO__)
    if (isOnline) {
      // 顾客扫码首页：先出 Hero/价目，短延迟再挂作品集
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(mountGallery, { timeout: 700 })
      } else {
        setTimeout(mountGallery, 400)
      }
    } else if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(mountGallery, { timeout: 400 })
    } else {
      setTimeout(mountGallery, 200)
    }
  }

  const mountAbout = () => {
    showAbout.value = true
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(mountAbout, { timeout: 1200 })
  } else {
    setTimeout(mountAbout, 800)
  }

  const sentinel = document.getElementById('below-fold-sentinel')
  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    belowFoldObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) mountGallery()
      },
      { rootMargin: '120px' }
    )
    belowFoldObserver.observe(sentinel)
  }
})

onUnmounted(() => {
  window.removeEventListener('mount-gallery', mountGallery)
  belowFoldObserver?.disconnect()
})
</script>

<template>
  <!-- 美甲宣传站主布局 -->
  <NavHeader />
  <main>
    <HeroSection />
    <ServiceSection />
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
