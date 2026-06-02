import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 每次构建生成版本号，追加到图片 URL，避免 GitHub Pages CDN 长期缓存旧大图
const siteBuildVer = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 相对路径：支持本地 file:// 与离线包内嵌浏览
  base: './',
  define: {
    __SITE_BUILD_VER__: JSON.stringify(siteBuildVer),
  },
  build: {
    // 关闭 module 分包，便于 file:// 直接打开（Chrome / 手机浏览器）
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
