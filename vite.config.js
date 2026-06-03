import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { galleryAdminPlugin } from './scripts/gallery-admin-plugin.mjs'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function loadJsonFile(relPath) {
  try {
    const fp = path.join(projectRoot, relPath)
    if (!fs.existsSync(fp)) return {}
    return JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch {
    return {}
  }
}

// 构建时注入线上仓库与店主手机号（供手机扫码管理）
const deployCfg = loadJsonFile('deploy.config.json')
const adminCfg = fs.existsSync(path.join(projectRoot, 'admin.config.json'))
  ? loadJsonFile('admin.config.json')
  : loadJsonFile('admin.config.example.json')
// 构建时写入 revision 快照，首屏用打包数据、后台再比对是否需拉远程
const galleryRevisionCfg = loadJsonFile('public/gallery-revision.json')
const githubRepoMatch = (deployCfg.githubRepoUrl || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
const githubRepo = githubRepoMatch ? `${githubRepoMatch[1]}/${githubRepoMatch[2]}` : ''

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
export default defineConfig(({ command }) => ({
  plugins: [vue(), galleryAdminPlugin()],
  // 相对路径：支持本地 file:// 与离线包内嵌浏览
  base: './',
  // 手机扫码管理须监听局域网 IP（--host）
  server: {
    host: true,
    port: 5173,
  },
  define: {
    __SITE_BUILD_VER__: JSON.stringify(siteBuildVer),
    __CDN_BASE__: JSON.stringify(command === 'build' ? resolveCdnBase() : ''),
    __GITHUB_REPO__: JSON.stringify(command === 'build' ? githubRepo : ''),
    __GITHUB_BRANCH__: JSON.stringify('master'),
    __ADMIN_PHONE__: JSON.stringify(String(adminCfg.adminPhone || '15235952769')),
    // 与 public/gallery-revision.json 同步，扫码首屏即可显示「最新款式」
    __GALLERY_BUILD_REV__: JSON.stringify(Number(galleryRevisionCfg.rev) || 0),
    __GALLERY_BUILD_LATEST_IDS__: JSON.stringify(
      Array.isArray(galleryRevisionCfg.latestIds) ? galleryRevisionCfg.latestIds : []
    ),
    // GitHub Pages 直链，CDN 失败时回退（微信内 jsDelivr 偶发不可用）
    __PUBLIC_SITE_URL__: JSON.stringify(String(deployCfg.publicUrl || '').trim().replace(/\/$/, '')),
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
}))
