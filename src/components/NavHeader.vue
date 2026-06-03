<script setup>
// 从 vue 引入响应式 API
import { ref } from 'vue'
// 引入品牌与导航数据
import { brand, navItems } from '../data/siteContent.js'

// 定义向父组件抛出滚动事件
const emit = defineEmits(['navigate'])

// 移动端菜单展开状态
const menuOpen = ref(false)

// 点击导航时平滑滚动到对应区块
function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
  emit('navigate', id)
}

// 切换移动端菜单
function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

// 移动端点击菜单项后关闭抽屉
function handleNavClick(id) {
  scrollToSection(id)
  menuOpen.value = false
}
</script>

<template>
  <!-- 固定顶栏：滚动时始终可见 -->
  <header class="nav-header">
    <div class="nav-inner container">
      <!-- 品牌 Logo 区 -->
      <a href="#home" class="brand" @click.prevent="scrollToSection('home')">
        <span class="brand-icon">💅</span>
        <span class="brand-text">
          <span class="brand-name">{{ brand.name }}</span>
          <span class="brand-tag">{{ brand.tagline }}</span>
        </span>
      </a>

      <!-- 桌面端导航链接 -->
      <nav class="nav-links" aria-label="主导航">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="nav-link"
          @click.prevent="scrollToSection(item.id)"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- 预约按钮 -->
      <button class="nav-cta btn-primary" @click="scrollToSection('contact')">
        立即预约
      </button>

      <!-- 移动端汉堡按钮 -->
      <button
        class="menu-toggle"
        :aria-expanded="menuOpen"
        aria-label="切换菜单"
        @click="toggleMenu"
      >
        <span :class="{ open: menuOpen }"></span>
      </button>
    </div>

    <!-- 移动端下拉菜单 -->
    <nav v-show="menuOpen" class="mobile-menu" aria-label="移动端导航">
      <a
        v-for="item in navItems"
        :key="item.id"
        :href="`#${item.id}`"
        class="mobile-link"
        @click.prevent="handleNavClick(item.id)"
      >
        {{ item.label }}
      </a>
      <button class="btn-primary mobile-cta" @click="handleNavClick('contact')">
        立即预约
      </button>
    </nav>
  </header>
</template>

<style scoped>
/* 顶栏容器：毛玻璃效果 */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 250, 248, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(201, 168, 124, 0.15);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 24px;
}

/* 品牌区布局 */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.brand-tag {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: var(--color-primary);
  text-transform: uppercase;
}

/* 桌面导航链接 */
.nav-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover {
  color: var(--color-primary-dark);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-primary);
  transition: width 0.2s;
}

.nav-link:hover::after {
  width: 100%;
}

/* 顶栏预约按钮略小一号 */
.nav-cta {
  padding: 10px 24px;
  font-size: 0.875rem;
}

/* 汉堡菜单默认隐藏 */
.menu-toggle {
  display: none;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
}

.menu-toggle span,
.menu-toggle span::before,
.menu-toggle span::after {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: transform 0.3s, opacity 0.3s;
}

.menu-toggle span {
  position: relative;
}

.menu-toggle span::before,
.menu-toggle span::after {
  content: '';
  position: absolute;
  left: 0;
}

.menu-toggle span::before {
  top: -7px;
}

.menu-toggle span::after {
  top: 7px;
}

.menu-toggle span.open {
  background: transparent;
}

.menu-toggle span.open::before {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-toggle span.open::after {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* 移动端菜单面板 */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 16px 24px 24px;
  gap: 8px;
  border-top: 1px solid rgba(201, 168, 124, 0.15);
}

.mobile-link {
  padding: 12px 0;
  font-size: 1rem;
  color: var(--color-text);
  border-bottom: 1px solid rgba(201, 168, 124, 0.1);
}

.mobile-cta {
  margin-top: 12px;
  width: 100%;
}

/* 响应式：平板及以下隐藏桌面导航 */
@media (max-width: 900px) {
  .nav-links,
  .nav-cta {
    display: none;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-menu {
    display: flex;
  }
}
</style>
