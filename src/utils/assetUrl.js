/**
 * 将 public 静态资源路径转为相对当前页的 URL。
 * GitHub Pages 部署在 /仓库名/ 子目录，根路径 /xxx 会指到 github.io/xxx 导致 404；
 * file:// 离线包同样不能用 / 开头。统一加 ./ 前缀即可兼容两种场景。
 */

// 构建时注入，用于破除 CDN 对 hb.jpg 等大文件的旧缓存
const buildVer = typeof __SITE_BUILD_VER__ !== 'undefined' ? __SITE_BUILD_VER__ : ''

// 拼接相对路径与可选版本查询参数
function withBase(rel) {
  const url = `./${rel}`
  return buildVer ? `${url}?v=${buildVer}` : url
}

export function assetUrl(path) {
  // 空值原样返回，避免模板报错
  if (!path) return path
  // 已是完整 http(s) 链接（如地图）不再改写
  if (/^https?:\/\//i.test(path)) return path
  // 去掉开头的 ./ 或 /，再拼成相对路径
  const rel = String(path).replace(/^\.\//, '').replace(/^\//, '')
  return withBase(rel)
}

// 作品集网格封面：优先加载 build 生成的 .thumb 小图（约 420px）
export function coverThumbUrl(src) {
  if (!src) return src
  if (/^https?:\/\//i.test(src)) return src
  if (/\.(mp4|webm|mov)$/i.test(src)) return src
  const rel = String(src).replace(/^\.\//, '').replace(/^\//, '')
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
  return withBase(thumb)
}
