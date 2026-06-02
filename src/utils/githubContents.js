/**
 * GitHub Contents API（线上店主管理：浏览器直连 GitHub 写入仓库）
 */
import { getGithubToken } from '../composables/useAdminAuth.js'

// 构建时从 deploy.config 注入，如 han201006947/huahua-nai
const REPO = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''
// 源码分支（push 后 GitHub Actions 会 sync 并 deploy gh-pages）
const BRANCH = typeof __GITHUB_BRANCH__ !== 'undefined' ? __GITHUB_BRANCH__ : 'master'

// 是否已配置线上仓库（有则走 GitHub 管理，无则仅本地 dev API）
export function isOnlineGalleryAdmin() {
  return Boolean(REPO && getGithubToken())
}

// GitHub API 根路径
function apiUrl(path) {
  return `https://api.github.com/repos/${REPO}/contents/${path}`
}

// 统一 fetch，附带 PAT
async function ghFetch(path, options = {}) {
  const token = getGithubToken()
  if (!token) throw new Error('未登录 GitHub，请重新扫店主二维码')
  const res = await fetch(`${apiUrl(path)}${options.search || ''}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API 失败 (${res.status})`)
  }
  return res
}

// 文本文件 UTF-8 → base64（GitHub PUT 要求）
function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin)
}

// base64 → 文本
function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// 读取仓库内文本文件
export async function readRepoText(path) {
  const res = await ghFetch(path, { search: `?ref=${BRANCH}` })
  const data = await res.json()
  if (Array.isArray(data)) throw new Error(`${path} 是目录不是文件`)
  return { text: base64ToUtf8(data.content), sha: data.sha }
}

// 写入/更新文本文件
export async function writeRepoText(path, text, sha, message) {
  await ghFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `update ${path}`,
      content: utf8ToBase64(text),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
}

// 上传二进制（图片/视频）
export async function writeRepoBinary(path, base64Data, sha, message) {
  const raw = String(base64Data || '')
  const content = raw.includes(',') ? raw.split(',')[1] : raw
  await ghFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `upload ${path}`,
      content,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
}

// 删除文件
export async function deleteRepoFile(path, sha, message) {
  await ghFetch(path, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `delete ${path}`,
      sha,
      branch: BRANCH,
    }),
  })
}

// 列出目录（一层）
export async function listRepoDir(dirPath) {
  const res = await ghFetch(dirPath, { search: `?ref=${BRANCH}` })
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// 从 raw 拉取 galleryAlbums.js 并解析
export async function fetchGalleryAlbumsFromRepo() {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/src/data/galleryAlbums.js?t=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('读取作品集失败')
  const text = await res.text()
  const blob = new Blob([text], { type: 'text/javascript' })
  const modUrl = URL.createObjectURL(blob)
  try {
    const mod = await import(/* @vite-ignore */ modUrl)
    return [...(mod.galleryAlbums || [])]
  } finally {
    URL.revokeObjectURL(modUrl)
  }
}

export { REPO, BRANCH }
