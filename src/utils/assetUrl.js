/**
 * 静态资源 URL：线上走 jsDelivr gh-pages（含 .thumb 小图，国内更快）
 * 店主与顾客默认同一 CDN；新上传尚未 deploy 时由组件 @error 回退 master / Pages 直链
 */
// 构建时注入：jsDelivr 根地址，如 https://cdn.jsdelivr.net/gh/user/repo@gh-pages
const cdnBase = typeof __CDN_BASE__ !== 'undefined' ? __CDN_BASE__ : ''
// 构建版本号，破除 CDN 旧缓存
const buildVer = typeof __SITE_BUILD_VER__ !== 'undefined' ? __SITE_BUILD_VER__ : ''
// 仓库名，店主 gh-pages 404 时回退 master/public/
const githubRepo = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''
// GitHub Pages 站点根（CDN 失败时回退，与 deploy.config publicUrl 一致）
const publicSiteUrl =
  typeof __PUBLIC_SITE_URL__ !== 'undefined' ? String(__PUBLIC_SITE_URL__ || '') : ''

// 相对路径规范化
function normalizeRel(path) {
  return String(path || '').replace(/^\.\//, '').replace(/^\//, '')
}

// gh-pages：与 app 同域相对路径（少一跳 CDN）；离线包仍用 ./
function isOnPagesSite() {
  if (typeof window === 'undefined' || !publicSiteUrl) return false
  try {
    const page = new URL(window.location.href)
    const site = new URL(publicSiteUrl.endsWith('/') ? publicSiteUrl : `${publicSiteUrl}/`)
    const basePath = site.pathname.replace(/\/$/, '') || '/'
    return page.origin === site.origin && page.pathname.startsWith(basePath)
  } catch {
    return false
  }
}

// 封面/静态图 URL（Pages 上优先同域相对路径）
function withGhPages(rel) {
  const q = buildVer ? `?v=${buildVer}` : ''
  if (isOnPagesSite()) return `./${rel}${q}`
  if (cdnBase) return `${cdnBase}/${rel}${q}`
  return `./${rel}${q}`
}

// GitHub Pages 直链（不经过 jsDelivr，新 deploy 后更快生效）
export function pagesAssetUrl(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path) || /^blob:/i.test(path)) return path
  const rel = normalizeRel(path)
  if (publicSiteUrl) {
    const bust =
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gallery-media-bust')) ||
      buildVer ||
      ''
    const q = bust ? `?t=${bust}` : ''
    return `${publicSiteUrl}/${rel}${q}`
  }
  return `./${rel}`
}

// 网格缩略图 Pages 直链
export function pagesCoverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src) || /^blob:/i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = normalizeRel(src)
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return pagesAssetUrl(`./${thumb}`)
}

// 店主预览：master 上 public/ 原图（仅 gh-pages 404 时回退，如新上传未 deploy）
export function ownerMasterFallbackUrl(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path) || /^blob:/i.test(path)) return path
  const rel = normalizeRel(path)
  if (!githubRepo) return `./${rel}`
  const bust =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gallery-media-bust')) ||
    buildVer ||
    ''
  const q = bust ? `?t=${bust}` : ''
  return `https://cdn.jsdelivr.net/gh/${githubRepo}@master/public/${rel}${q}`
}

export function assetUrl(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path) || /^blob:/i.test(path)) return path
  return withGhPages(normalizeRel(path))
}

// 作品集网格：线上 load .thumb 小图；本地 dev 用原图（thumb 要 build 后才生成）
export function coverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src) || /^blob:/i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = normalizeRel(src)
  if (import.meta.env.DEV) {
    return withGhPages(rel)
  }
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return withGhPages(thumb)
}

// 视频首帧封面（build 时 optimize-dist-videos 生成 .poster.jpg，点开详情前即显示）
export function videoPosterUrl(videoSrc) {
  if (!videoSrc || !/\.(mp4|webm|mov)$/i.test(videoSrc)) return ''
  const rel = normalizeRel(videoSrc).replace(/\.(mp4|mov|webm)$/i, '.poster.jpg')
  return withGhPages(rel)
}

// 网格卡片有效封面：相册含图时用第一张图；仅视频时用 poster，避免黑屏
export function gridCoverForAlbum(album) {
  if (!album) return ''
  const cover = String(album.cover || '')
  if (!/\.(mp4|webm|mov)$/i.test(cover)) return cover
  const firstImage = (album.media || []).find((m) => m.type === 'image')
  if (firstImage?.src) return firstImage.src
  return cover.replace(/\.(mp4|webm|mov)$/i, '.poster.jpg')
}

// 网格是否只能显示视频占位（无图且无 poster 路径可展示）
export function gridCoverIsVideoOnly(album) {
  const src = gridCoverForAlbum(album)
  return /\.(mp4|webm|mov)$/i.test(src)
}

// 详情内末行视频跨列，避免 3 列网格右侧留白
export function detailVideoGridSpan(mediaLength, index, itemType) {
  if (itemType !== 'video' || index !== mediaLength - 1) return 1
  const rem = mediaLength % 3
  if (rem === 1) return 3
  if (rem === 2) return 2
  return 1
}
