<script setup>
// 引入 Vue 响应式 API
import { ref } from 'vue'

// 店主手机号展示
const phone = ref('15235952769')
</script>

<template>
  <!-- 未登录时简短提示：顾客仍可浏览下方作品集 -->
  <div class="admin-login">
    <p class="admin-login-title">款式管理需店主登录</p>
    <p class="admin-login-desc">
      仅微信 <strong>{{ phone }}</strong> 对应店主可添加/删除款式与图片。请先
      <code>npm run dev</code>，再 <code>npm run gen-admin-qr</code> 生成二维码，用微信扫描
      <code>release/店主管理登录二维码.png</code>。扫码后自动登录并进入作品集；其他人只能浏览，看不到删除按钮。
    </p>
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

.admin-login-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.55;
  color: #6b5344;
}

.admin-login-desc code {
  font-size: 0.78rem;
  background: #f3ebe3;
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
