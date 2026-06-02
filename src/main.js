import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 店主扫码登录须在页面挂载前完成，否则管理面板不出现
import { initAdminAuth } from './composables/useAdminAuth.js'

// 先登录再挂载，避免 GallerySection 懒加载错过 ?adminLogin=
async function bootstrap() {
  if (import.meta.env.DEV) {
    await initAdminAuth()
  }
  createApp(App).mount('#app')
}

bootstrap()
