/**
 * 静态资源 URL：线上走 jsDelivr（国内更快），离线包仍用相对路径 ./
 */
import { isOwnerGalleryPreview } from '../composables/useAdminAuth.js'

// 构建时注入：jsDelivr 根地址，如 https://cdn.jsdelivr.net/gh/user/repo@gh-pages
const cdnBase = typeof __CDN_BASE__ !== 'undefined' ? __CDN_BASE__ : ''
// 构建版本号，破除 CDN 旧缓存
const buildVer = typeof __SITE_BUILD_VER__ !== 'undefined' ? __SITE_BUILD_VER__ : ''
// 仓库名，店主预览 master 上 public/ 用
const githubRepo = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''

// 店主登录后：图片走 master/public（上传后立即可见，不必等 gh-pages deploy）
function withMasterPreview(rel) {
  if (!githubRepo) return `./${rel}`
  return `https://cdn.jsdelivr.net/gh/${githubRepo}@master/public/${rel}`
}

// 拼接最终 URL（CDN 或相对路径 + 可选 ?v=）
function withBase(rel) {
  if (isOwnerGalleryPreview()) return withMasterPreview(rel)
  const q = buildVer ? `?v=${buildVer}` : ''
  if (cdnBase) return `${cdnBase}/${rel}${q}`
  return `./${rel}${q}`
}

export function assetUrl(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  const rel = String(path).replace(/^\.\//, '').replace(/^\//, '')
  return withBase(rel)
}

// 作品集网格：线上 load .thumb 小图；本地 dev 用原图（thumb 要 build 后才生成）
export function coverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = String(src).replace(/^\.\//, '').replace(/^\//, '')
  // 开发态新增款式尚未 build，public 里没有 .thumb 文件
  if (import.meta.env.DEV) {
    return withBase(rel)
  }
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return withBase(thumb)
}

// 是否启用 jsDelivr（供组件判断是否需预连接等）
export function isOnlineCdn() {
  return Boolean(cdnBase)
}
