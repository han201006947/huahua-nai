<script setup>
// 引入各页面区块组件
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import NavHeader from './components/NavHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ServiceSection from './components/ServiceSection.vue'
import LatestStylesSection from './components/LatestStylesSection.vue'
import ContactSection from './components/ContactSection.vue'
import AppFooter from './components/AppFooter.vue'

// 作品集：店主 #gallery 同步 import；顾客懒加载 chunk，首屏只出 Hero
const GallerySection = defineAsyncComponent(() => import('./components/GallerySection.vue'))

const AboutSection = defineAsyncComponent(() => import('./components/AboutSection.vue'))

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
