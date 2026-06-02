import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// 每次构建生成版本号，追加到图片 URL，避免 CDN 长期缓存旧大图
const siteBuildVer = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

// 从 deploy.config 解析 jsDelivr 地址（国内访问 GitHub 原站较慢）
function resolveCdnBase() {
  try {
    const cfgPath = path.join(projectRoot, 'deploy.config.json')
    if (!fs.existsSync(cfgPath)) return ''
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    const m = (cfg.githubRepoUrl || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
    if (!m) return ''
    return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@gh-pages`
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 相对路径：支持本地 file:// 与离线包内嵌浏览
  base: './',
  define: {
    __SITE_BUILD_VER__: JSON.stringify(siteBuildVer),
    __CDN_BASE__: JSON.stringify(resolveCdnBase()),
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
