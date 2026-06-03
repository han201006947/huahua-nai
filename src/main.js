import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initAdminAuth } from './composables/useAdminAuth.js'

// 先挂载页面再验登录，缩短扫码白屏时间
async function bootstrap() {
  const app = createApp(App)
  app.mount('#app')
  await initAdminAuth()
}

bootstrap()
