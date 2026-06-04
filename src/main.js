import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initAdminAuth } from './composables/useAdminAuth.js'

// 先挂载页面；登录校验略延后，避免与 CSS/JS 抢首屏带宽（尤其店主扫码）
function bootstrap() {
  const app = createApp(App)
  app.mount('#app')
  const runAuth = () => {
    void initAdminAuth()
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(runAuth, { timeout: 500 })
  } else {
    window.setTimeout(runAuth, 120)
  }
}

bootstrap()
