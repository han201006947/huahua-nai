<script setup>
// 引入 Vue 响应式 API
import { ref, onMounted } from 'vue'

// 登录成功后通知父组件刷新
const emit = defineEmits(['logged-in'])

// 店主手机号展示
const phone = ref('15235952769')
// 登录链接（用于提示或复制）
const loginUrl = ref('')
// 加载中
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/gallery/auth/login-url')
    if (res.ok) {
      const data = await res.json()
      loginUrl.value = data.loginUrl || ''
    }
  } catch {
    /* dev 未启动时忽略 */
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- 未登录时提示：仅店主扫码后可管理 -->
  <div class="admin-login">
    <p class="admin-login-title">款式管理需店主登录</p>
    <p class="admin-login-desc">
      仅微信 <strong>{{ phone }}</strong> 对应店主可操作添加/删除款式与图片。
      请用微信扫描 <code>release/店主管理登录二维码.png</code>（运行
      <code>npm run gen-admin-qr</code> 生成）。
    </p>
    <p v-if="loginUrl" class="admin-login-url">
      扫码后将打开本站并自动登录；其他人看不到删除按钮，也无法修改。
    </p>
    <p v-if="loading" class="admin-login-muted">正在连接本地管理服务…</p>
  </div>
</template>

<style scoped>
.admin-login {
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e8dccf;
  border-radius: 10px;
  background: #fff8f0;
}

.admin-login-title {
  margin: 0 0 0.4rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #5c4033;
}

.admin-login-desc,
.admin-login-url,
.admin-login-muted {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  line-height: 1.55;
  color: #6b5344;
}

.admin-login-desc code,
.admin-login-url code {
  font-size: 0.78rem;
  background: #f3ebe3;
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
