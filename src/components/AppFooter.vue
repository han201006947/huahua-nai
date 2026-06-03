<script setup>
// 引入品牌信息
import { brand, contactInfo } from '../data/siteContent.js'

// 当前年份，用于版权行
const year = new Date().getFullYear()
</script>

<template>
  <!-- 页脚 -->
  <footer class="footer">
    <div class="container footer-inner">
      <!-- 品牌区 -->
      <div class="footer-brand">
        <span class="footer-logo">💅 {{ brand.name }}</span>
        <p class="footer-slogan">{{ brand.slogan }}</p>
      </div>

      <!-- 快捷链接 -->
      <div class="footer-links">
        <h4>快速导航</h4>
        <a href="#services">服务项目</a>
        <a href="#gallery">作品展示</a>
        <a href="#about">关于我们</a>
        <a href="#contact">预约联系</a>
      </div>

      <!-- 联系方式 -->
      <div class="footer-contact">
        <h4>联系方式</h4>
        <p>{{ contactInfo.address }}</p>
        <p>{{ contactInfo.phone }}</p>
        <p>{{ contactInfo.wechat }}</p>
        <p>{{ contactInfo.hours }}</p>
      </div>
    </div>

    <!-- 版权行 -->
    <div class="footer-bottom">
      <div class="container">
        <p>© {{ year }} {{ brand.name }} 个人美甲工作室 · 保留所有权利</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* 页脚主区域 */
.footer {
  background: var(--color-text);
  color: rgba(255, 255, 255, 0.85);
}

.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding: 64px 24px 48px;
}

.footer-logo {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
}

.footer-slogan {
  margin-top: 12px;
  font-size: 0.875rem;
  opacity: 0.7;
  line-height: 1.6;
}

.footer-links h4,
.footer-contact h4 {
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 16px;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links a {
  font-size: 0.9rem;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
  color: var(--color-accent);
}

.footer-contact p {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-bottom: 8px;
}

/* 底部版权条 */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 24px;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 48px 24px 32px;
  }
}
</style>
