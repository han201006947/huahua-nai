/**
 * 静态资源 URL：线上走 jsDelivr（国内更快），离线包仍用相对路径 ./ 
 */

// 构建时注入：jsDelivr 根地址，如 https://cdn.jsdelivr.net/gh/user/repo@gh-pages
const cdnBase = typeof __CDN_BASE__ !== 'undefined' ? __CDN_BASE__ : ''
// 构建版本号，破除 CDN 旧缓存
const buildVer = typeof __SITE_BUILD_VER__ !== 'undefined' ? __SITE_BUILD_VER__ : ''

// 拼接最终 URL（CDN 或相对路径 + 可选 ?v=）
function withBase(rel) {
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

// 作品集网格：加载 .thumb 小图（约 320px，十几 KB）
export function coverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = String(src).replace(/^\.\//, '').replace(/^\//, '')
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return withBase(thumb)
}

// 是否启用 jsDelivr（供组件判断是否需预连接等）
export function isOnlineCdn() {
  return Boolean(cdnBase)
}
