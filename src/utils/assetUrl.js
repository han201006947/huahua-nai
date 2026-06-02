/**
 * 将 public 静态资源路径转为相对当前页的 URL。
 * GitHub Pages 部署在 /仓库名/ 子目录，根路径 /xxx 会指到 github.io/xxx 导致 404；
 * file:// 离线包同样不能用 / 开头。统一加 ./ 前缀即可兼容两种场景。
 */
export function assetUrl(path) {
  // 空值原样返回，避免模板报错
  if (!path) return path
  // 已是完整 http(s) 链接（如地图）不再改写
  if (/^https?:\/\//i.test(path)) return path
  // 去掉开头的 ./ 或 /，再拼成相对路径
  const rel = String(path).replace(/^\.\//, '').replace(/^\//, '')
  return `./${rel}`
}
