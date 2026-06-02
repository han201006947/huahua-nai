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

const showHeavySections = ref(false)
let belowFoldObserver = null

onMounted(() => {
  const mountHeavy = () => {
    showHeavySections.value = true
  }
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
