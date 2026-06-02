<script setup>
// 引入各页面区块组件
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import NavHeader from './components/NavHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ServiceSection from './components/ServiceSection.vue'
import ContactSection from './components/ContactSection.vue'
import AppFooter from './components/AppFooter.vue'

// 懒挂载：作品集/关于我们延后，扫码后先渲染价目与导航
const GallerySection = defineAsyncComponent(() => import('./components/GallerySection.vue'))
const AboutSection = defineAsyncComponent(() => import('./components/AboutSection.vue'))

// 扫码登录或直达 #gallery 时立刻挂载作品集，避免 hash 锚点找不到节点
function shouldMountGalleryImmediately() {
  // 微信扫码链接带 #gallery，若懒加载会导致锚点无效、看起来像「无内容」
  if (typeof window === 'undefined') return false
  if (window.location.hash.includes('gallery')) return true
  return new URLSearchParams(window.location.search).has('adminLogin')
}

// 作品集/关于我们是否已挂载（默认延迟，扫码场景立即 true）
const showHeavySections = ref(shouldMountGalleryImmediately())
let belowFoldObserver = null

onMounted(() => {
  const mountHeavy = () => {
    showHeavySections.value = true
  }
  // 已因扫码/锚点提前挂载则不再延迟
  if (showHeavySections.value) return
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(mountHeavy, { timeout: 400 })
  } else {
    setTimeout(mountHeavy, 200)
  }

  const sentinel = document.getElementById('below-fold-sentinel')
  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    belowFoldObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) showHeavySections.value = true
      },
      { rootMargin: '120px' }
    )
    belowFoldObserver.observe(sentinel)
  }
})

onUnmounted(() => {
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
    <GallerySection v-if="showHeavySections" />
    <AboutSection v-if="showHeavySections" />
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
