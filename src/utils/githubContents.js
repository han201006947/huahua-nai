/**
 * GitHub Contents API（线上店主管理：浏览器直连 GitHub 写入仓库）
 */
import { getGithubToken } from '../composables/useAdminAuth.js'

// 构建时从 deploy.config 注入，如 han201006947/huahua-nai
const REPO = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''
// 首选源码分支名
const PREFERRED_BRANCH = typeof __GITHUB_BRANCH__ !== 'undefined' ? __GITHUB_BRANCH__ : 'master'

// 解析后的写入分支（缓存）
let resolvedBranch = null

// 是否已配置线上仓库
export function isOnlineGalleryAdmin() {
  return Boolean(REPO && getGithubToken())
}

// 构造鉴权头
function authHeaders(extra = {}) {
  const token = getGithubToken()
  if (!token) throw new Error('未登录 GitHub，请重新扫店主二维码')
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  }
}

// 将 GitHub 英文错误转为中文提示
function toFriendlyGithubError(message) {
  const msg = String(message || '')
  if (/branch master not found/i.test(msg) || /branch main not found/i.test(msg)) {
    return 'GitHub 还没有 master 源码分支。请在电脑项目目录执行 git push -u origin master，成功后再用手机添加。'
  }
  if (/not found/i.test(msg) && /ref/i.test(msg)) {
    return 'GitHub 仓库分支未就绪，请先在电脑执行 git push -u origin master。'
  }
  return msg || 'GitHub 操作失败'
}

// GitHub API 根路径
function apiUrl(path) {
  return `https://api.github.com/repos/${REPO}/contents/${path}`
}

// 查询某分支 ref 是否存在
async function refExists(branch) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/ref/heads/${branch}`, {
    headers: authHeaders(),
  })
  return res.ok
}

// 从 gh-pages 创建 master（仅当 master 不存在时的应急，完整同步仍需电脑 push）
async function bootstrapMasterFromGhPages() {
  const ghRes = await fetch(`https://api.github.com/repos/${REPO}/git/ref/heads/gh-pages`, {
    headers: authHeaders(),
  })
  if (!ghRes.ok) {
    throw new Error('GitHub 尚无 master 分支，且无法从 gh-pages 创建。请在电脑执行 git push -u origin master。')
  }
  const ghData = await ghRes.json()
  const sha = ghData.object?.sha
  if (!sha) throw new Error('无法读取 gh-pages 分支，请在电脑执行 git push -u origin master。')

  const createRes = await fetch(`https://api.github.com/repos/${REPO}/git/refs`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ref: 'refs/heads/master', sha }),
  })
  if (!createRes.ok && createRes.status !== 422) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(toFriendlyGithubError(err.message))
  }
}

// 确保有可写入的源码分支（master / main）
export async function ensureSourceBranch() {
  if (resolvedBranch) return resolvedBranch
  for (const name of [PREFERRED_BRANCH, 'main', 'master']) {
    if (await refExists(name)) {
      resolvedBranch = name
      return resolvedBranch
    }
  }
  await bootstrapMasterFromGhPages()
  resolvedBranch = PREFERRED_BRANCH
  return resolvedBranch
}

// 统一 fetch，附带 PAT（GET 才带 ?ref=）
async function ghFetch(path, options = {}) {
  const branch = await ensureSourceBranch()
  const method = options.method || 'GET'
  const search = method === 'GET' ? `?ref=${branch}` : ''
  const res = await fetch(`${apiUrl(path)}${search}`, {
    ...options,
    headers: authHeaders(options.headers),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(toFriendlyGithubError(err.message || `GitHub API 失败 (${res.status})`))
  }
  return res
}

// 文本文件 UTF-8 → base64
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
  const res = await ghFetch(path, {})
  const data = await res.json()
  if (Array.isArray(data)) throw new Error(`${path} 是目录不是文件`)
  return { text: base64ToUtf8(data.content), sha: data.sha }
}

// 写入/更新文本文件
export async function writeRepoText(path, text, sha, message) {
  const branch = await ensureSourceBranch()
  await ghFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `update ${path}`,
      content: utf8ToBase64(text),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
}

// 上传二进制（图片/视频）
export async function writeRepoBinary(path, base64Data, sha, message) {
  const branch = await ensureSourceBranch()
  const raw = String(base64Data || '')
  const content = raw.includes(',') ? raw.split(',')[1] : raw
  await ghFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `upload ${path}`,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
}

// 删除文件
export async function deleteRepoFile(path, sha, message) {
  const branch = await ensureSourceBranch()
  await ghFetch(path, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `delete ${path}`,
      sha,
      branch,
    }),
  })
}

// 列出目录（一层）
export async function listRepoDir(dirPath) {
  const res = await ghFetch(dirPath, {})
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// 从 raw 拉取 galleryAlbums.js 并解析
export async function fetchGalleryAlbumsFromRepo() {
  const branch = await ensureSourceBranch()
  const url = `https://raw.githubusercontent.com/${REPO}/${branch}/src/data/galleryAlbums.js?t=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('作品集尚未同步，请稍后再试或在电脑 push master 后重试')
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

export { REPO, PREFERRED_BRANCH as BRANCH }
