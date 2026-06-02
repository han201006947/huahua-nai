<script setup>
// 引入关于区块文案与服务承诺
import { aboutContent, promises } from '../data/siteContent.js'
// 关于页拼贴图相对路径
import { assetUrl } from '../utils/assetUrl.js'
</script>

<template>
  <!-- 关于我们区块 -->
  <section id="about" class="about section">
    <div class="container about-grid">
      <!-- 左侧图片拼贴 -->
      <div class="about-visual">
        <img
          class="about-img main"
          :src="assetUrl('/caihui/c2.jpg')"
          alt="手绘彩绘美甲展示"
          loading="lazy"
        />
        <img
          class="about-img sub"
          :src="assetUrl('/fashi/f1/IMG20260531202334.jpg')"
          alt="法式蝴蝶结美甲展示"
          loading="lazy"
        />
      </div>

      <!-- 右侧文案 -->
      <div class="about-content">
        <span class="section-label">About Us</span>
        <h2 class="section-title about-title">{{ aboutContent.title }}</h2>
        <p v-for="(text, index) in aboutContent.paragraphs" :key="index" class="about-text">
          {{ text }}
        </p>

        <!-- 四大承诺卡片 -->
        <div class="promise-grid">
          <div v-for="item in promises" :key="item.title" class="promise-item">
            <span class="promise-icon">{{ item.icon }}</span>
            <div>
              <h4 class="promise-title">{{ item.title }}</h4>
              <p class="promise-desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 关于区块浅粉背景 */
.about {
  background: var(--color-bg-soft);
}

/* 双栏布局 */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

/* 图片拼贴区 */
.about-visual {
  position: relative;
}

.about-img {
  border-radius: var(--radius-md);
  object-fit: cover;
  box-shadow: var(--shadow-card);
}

.about-img.main {
  width: 85%;
  height: 480px;
}

.about-img.sub {
  position: absolute;
  bottom: -30px;
  right: 0;
  width: 55%;
  height: 240px;
  border: 4px solid var(--color-bg-soft);
}

.about-title {
  text-align: left;
  margin-bottom: 24px;
}

.about-text {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  line-height: 1.85;
  margin-bottom: 16px;
}

/* 承诺列表两列网格 */
.promise-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 32px;
}

.promise-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.promise-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.promise-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.promise-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .about-img.main {
    width: 100%;
    height: 360px;
  }

  .about-img.sub {
    width: 50%;
    height: 180px;
    bottom: -20px;
    right: 16px;
  }

  .promise-grid {
    grid-template-columns: 1fr;
  }
}
</style>
