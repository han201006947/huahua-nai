<script setup>
// 引入工作室联系信息（含微信二维码路径与说明文案）
import { contactInfo } from '../data/siteContent.js'
// 静态资源相对路径，GitHub Pages 子目录下微信二维码才能加载
import { assetUrl } from '../utils/assetUrl.js'
</script>

<template>
  <!-- 预约联系区块 -->
  <section id="contact" class="contact section">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Contact</span>
        <h2 class="section-title">预约 · 联系我们</h2>
        <p class="section-desc">{{ contactInfo.sectionDesc }}</p>
      </div>

      <div class="contact-grid">
        <!-- 左侧联系信息卡 -->
        <div class="info-card">
          <h3 class="info-title">{{ contactInfo.infoTitle }}</h3>

          <div class="info-item">
            <span class="info-icon">📍</span>
            <div>
              <p class="info-label">地址</p>
              <p class="info-value">{{ contactInfo.address }}</p>
            </div>
          </div>

          <div class="info-item">
            <span class="info-icon">📞</span>
            <div>
              <p class="info-label">电话</p>
              <p class="info-value">{{ contactInfo.phone }}</p>
            </div>
          </div>

          <div class="info-item">
            <span class="info-icon">💬</span>
            <div>
              <p class="info-label">微信</p>
              <p class="info-value">{{ contactInfo.wechat }}</p>
            </div>
          </div>

          <div class="info-item">
            <span class="info-icon">🕐</span>
            <div>
              <p class="info-label">营业时间</p>
              <p class="info-value">{{ contactInfo.hours }}</p>
            </div>
          </div>

          <!-- 点击跳转百度地图导航至工作室地址 -->
          <a
            class="map-placeholder"
            :href="contactInfo.mapUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>🗺️ 打开地图导航</span>
          </a>
        </div>

        <!-- 右侧微信扫码预约卡：替代原网页表单，客户直接加微信 -->
        <div class="wechat-card">
          <h3 class="wechat-title">{{ contactInfo.wechatCardTitle }}</h3>
          <p class="wechat-desc">{{ contactInfo.wechatCardDesc }}</p>
          <div class="wechat-qr-wrap">
            <img
              class="wechat-qr"
              :src="assetUrl(contactInfo.wechatQr)"
              :alt="contactInfo.wechatQrAlt"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p class="wechat-hint">{{ contactInfo.wechatQrHint }}</p>
          <p class="wechat-id">微信号：{{ contactInfo.wechat }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 双栏等高：左右卡片随较高一侧拉伸对齐 */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
  align-items: stretch;
}

/* 个人工作室信息卡片：纵向 flex，地图块贴底并撑满剩余高度 */
.info-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
}

.info-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: 28px;
}

.info-item {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
}

.info-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-label {
  font-size: 0.75rem;
  opacity: 0.75;
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.95rem;
  line-height: 1.5;
}

/* 地图导航：贴卡片底部，剩余高度由该区域吸收以保持左右等高 */
.map-placeholder {
  margin-top: auto;
  flex: 1;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  opacity: 0.85;
  color: inherit;
  text-decoration: none;
  transition: background 0.2s;
}

/* 悬停时略微提亮，提示可点击 */
.map-placeholder:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* 微信扫码预约卡片：与左侧同高 */
.wechat-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  box-shadow: var(--shadow-card);
  text-align: center;
}

.wechat-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-text);
  margin-bottom: 10px;
}

.wechat-desc {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 28px;
}

/* 二维码外框：全宽 flex 居中，图片在框内左右居中 */
.wechat-qr-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto 20px;
  padding: 16px;
  background: var(--color-bg);
  border: 1.5px solid rgba(201, 168, 124, 0.25);
  border-radius: var(--radius-md);
}

.wechat-qr {
  display: block;
  width: min(260px, 100%);
  height: auto;
  margin: 0 auto;
  border-radius: 4px;
}

.wechat-hint {
  font-size: 0.95rem;
  color: var(--color-text);
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.wechat-id {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
