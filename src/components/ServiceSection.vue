<script setup>
// 引入服务项目数据
import { services } from '../data/siteContent.js'
</script>

<template>
  <!-- 服务项目区块 -->
  <section id="services" class="services section">
    <div class="container">
      <!-- 区块标题 -->
      <div class="section-header">
        <span class="section-label">Our Services</span>
        <h2 class="section-title">专业美甲服务</h2>
        <p class="section-desc">
          从基础护理到造型定制，每一项服务都明码标价，满足您对美的所有想象。
        </p>
      </div>

      <!-- 服务卡片网格 -->
      <div class="service-grid">
        <article
          v-for="service in services"
          :key="service.id"
          class="service-card"
          :class="{ 'is-coming-soon': service.comingSoon }"
        >
          <!-- 即将推出角标 -->
          <span v-if="service.comingSoon" class="coming-soon-badge">即将推出</span>
          <!-- 服务图标 -->
          <div class="service-icon">{{ service.icon }}</div>
          <!-- 服务名称 -->
          <h3 class="service-title">{{ service.title }}</h3>
          <!-- 服务描述 -->
          <p class="service-desc">{{ service.desc }}</p>
          <!-- 参考价格 -->
          <span class="service-price">{{ service.price }}</span>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 服务区块浅粉背景 */
.services {
  background: var(--color-bg-soft);
}

/* 三列卡片网格 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

/* 单张服务卡片 */
.service-card {
  position: relative;
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: 36px 28px;
  box-shadow: var(--shadow-card);
  transition: transform 0.25s, box-shadow 0.25s;
  border: 1px solid rgba(201, 168, 124, 0.08);
}

/* 即将推出：弱化悬停，提示暂未开通 */
.service-card.is-coming-soon {
  opacity: 0.88;
  border-style: dashed;
}

.service-card.is-coming-soon:hover {
  transform: none;
}

/* 即将推出角标 */
.coming-soon-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary-dark);
  background: rgba(201, 168, 124, 0.18);
  padding: 4px 10px;
  border-radius: 999px;
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-soft);
}

.service-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}

.service-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.service-desc {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 20px;
}

.service-price {
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-dark);
  padding: 6px 14px;
  background: rgba(201, 168, 124, 0.12);
  border-radius: 999px;
}

/* 平板两列 */
@media (max-width: 900px) {
  .service-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手机单列 */
@media (max-width: 560px) {
  .service-grid {
    grid-template-columns: 1fr;
  }
}
</style>
