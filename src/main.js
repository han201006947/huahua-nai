import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initAdminAuth } from './composables/useAdminAuth.js'

async function bootstrap() {
  await initAdminAuth()
  createApp(App).mount('#app')
}

bootstrap()
