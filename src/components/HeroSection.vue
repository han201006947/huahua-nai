<script setup>
// 引入品牌文案、固定 Hero 图与亮点数据
import { brand, highlights, heroImage } from '../data/siteContent.js'
// 价目宣传图相对路径，线上子目录部署可正常显示
import { assetUrl } from '../utils/assetUrl.js'

// 滚动到预约区块
function goContact() {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}

// 滚动到作品集「最新款式」锚点（无新款时落在作品集顶部）
function goLatest() {
  const el = document.getElementById('gallery-latest') || document.getElementById('gallery')
  el?.scrollIntoView({ behavior: 'smooth' })
}

// 滚动到作品展示
function goGallery() {
  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <!-- 首页 Hero 区块 -->
  <section id="home" class="hero section">
    <!-- 背景装饰圆 -->
    <div class="hero-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="container hero-grid">
      <!-- 左侧文案 -->
      <div class="hero-content">
        <p class="hero-badge">{{ brand.heroBadge }}</p>
        <h1 class="hero-title">
          {{ brand.name }}
          <span class="hero-sub">{{ brand.heroSubtitle }}</span>
        </h1>
        <p class="hero-slogan">{{ brand.slogan }}</p>
        <p class="hero-desc">{{ brand.heroDesc }}</p>
        <div class="hero-actions">
          <button type="button" class="btn-latest" @click="goLatest">最新款式</button>
          <button type="button" class="btn-primary" @click="goContact">免费预约体验</button>
          <button type="button" class="btn-outline" @click="goGallery">浏览作品集</button>
        </div>

        <!-- 数据亮点条 -->
        <div class="hero-stats">
          <div v-for="item in highlights" :key="item.label" class="stat-item">
            <span class="stat-value">{{ item.value }}</span>
            <span class="stat-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧视觉区：固定价目宣传图，完整展示 -->
      <div class="hero-visual">
        <div class="visual-card main-card">
          <img
            :src="assetUrl(heroImage)"
            alt="花花美甲坊价目宣传单"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <div class="card-badge">价目一览</div>
        </div>
        <!-- 浮动小卡片装饰 -->
        <div class="visual-card float-card">
          <span class="float-icon">🌸</span>
          <p>100% 安全<br />优质材料</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Hero 区块：留出顶栏高度 */
.hero {
  position: relative;
  padding-top: calc(var(--header-height) + 48px);
  padding-bottom: 96px;
  overflow: hidden;
}

/* 背景柔光 blob */
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: var(--color-accent);
  top: -100px;
  right: -100px;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: var(--color-primary);
  bottom: -80px;
  left: -80px;
  opacity: 0.25;
}

/* 双栏网格布局 */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  position: relative;
}

.hero-badge {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  color: var(--color-primary);
  margin-bottom: 20px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 600;
  line-height: 1.15;
  color: var(--color-text);
}

.hero-sub {
  display: block;
  font-size: 0.55em;
  font-weight: 400;
  color: var(--color-primary-dark);
  margin-top: 4px;
}

.hero-slogan {
  margin-top: 20px;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-style: italic;
  color: var(--color-text-muted);
}

.hero-desc {
  margin-top: 20px;
  font-size: 1rem;
  color: var(--color-text-muted);
  max-width: 460px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

/* 「最新款式」：与作品集置顶区角标同色系 */
.btn-latest {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border: none;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #e91e8c, #ff6b9d);
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.28);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-latest:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(233, 30, 140, 0.35);
}

/* 数据统计行 */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(201, 168, 124, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-primary-dark);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* 右侧视觉区：大图与装饰卡上下排列，装饰卡不遮挡宣传图 */
.hero-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.main-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  background: var(--color-white);
}

/* 固定宣传图完整展示：不裁剪、按原始比例缩放 */
.main-card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.card-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.92);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-primary-dark);
}

/* 装饰卡放在大图下方，完全不遮挡价目宣传图 */
.float-card {
  position: relative;
  background: var(--color-white);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--color-text);
}

.float-icon {
  font-size: 1.75rem;
}

/* 平板及以下改为单列 */
@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
