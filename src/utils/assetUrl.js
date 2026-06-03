/**
 * 静态资源 URL：线上走 jsDelivr gh-pages（含 .thumb 小图，国内更快）
 * 店主与顾客默认同一 CDN；新上传尚未 deploy 时由组件 @error 回退 master
 */
// 构建时注入：jsDelivr 根地址，如 https://cdn.jsdelivr.net/gh/user/repo@gh-pages
const cdnBase = typeof __CDN_BASE__ !== 'undefined' ? __CDN_BASE__ : ''
// 构建版本号，破除 CDN 旧缓存
const buildVer = typeof __SITE_BUILD_VER__ !== 'undefined' ? __SITE_BUILD_VER__ : ''
// 仓库名，店主 gh-pages 404 时回退 master/public/
const githubRepo = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''

// gh-pages CDN（顾客与店主网格/详情默认走此路径，体积小加载快）
function withGhPages(rel) {
  const q = buildVer ? `?v=${buildVer}` : ''
  if (cdnBase) return `${cdnBase}/${rel}${q}`
  return `./${rel}${q}`
}

// 店主预览：master 上 public/ 原图（仅 gh-pages 404 时回退，如新上传未 deploy）
export function ownerMasterFallbackUrl(path) {
  if (!path) return path
  if (/^https?:\/\//i.test(path) || /^blob:/i.test(path)) return path
  const rel = String(path).replace(/^\.\//, '').replace(/^\//, '')
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
  const rel = String(path).replace(/^\.\//, '').replace(/^\//, '')
  return withGhPages(rel)
}

// 作品集网格：线上 load .thumb 小图；本地 dev 用原图（thumb 要 build 后才生成）
export function coverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src) || /^blob:/i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = String(src).replace(/^\.\//, '').replace(/^\//, '')
  // 开发态新增款式尚未 build，public 里没有 .thumb 文件
  if (import.meta.env.DEV) {
    return withGhPages(rel)
  }
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return withGhPages(thumb)
}

// 是否启用 jsDelivr（供组件判断是否需预连接等）
export function isOnlineCdn() {
  return Boolean(cdnBase)
}
