import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initAdminAuth } from './composables/useAdminAuth.js'

// 先挂载页面；登录校验放后台，不占用首屏时间
function bootstrap() {
  const app = createApp(App)
  app.mount('#app')
  void initAdminAuth()
}

bootstrap()
