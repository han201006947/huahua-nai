/**
 * 店主管理登录（本地 dev API 或 线上 GitHub Token）
 */
import { ref } from 'vue'

const SESSION_KEY = 'gallery-admin-session'
const GITHUB_TOKEN_KEY = 'gallery-github-token'
const isDev = import.meta.env.DEV
const githubRepo = typeof __GITHUB_REPO__ !== 'undefined' ? __GITHUB_REPO__ : ''
const adminPhoneCfg = typeof __ADMIN_PHONE__ !== 'undefined' ? __ADMIN_PHONE__ : '15235952769'

const isAdminLoggedIn = ref(false)
const adminPhone = ref(adminPhoneCfg)
let initDone = false

// 是否线上 GitHub 管理模式（与顾客同链接，无需本地 dev）
export function isOnlineAdminMode() {
  return !isDev && Boolean(githubRepo)
}

// 获取 GitHub PAT（线上写入仓库用）
export function getGithubToken() {
  return sessionStorage.getItem(GITHUB_TOKEN_KEY) || ''
}

// 店主已登录：可扫 master 上 public/ 并预览刚上传的图（顾客仍看 gh-pages）
export function isOwnerGalleryPreview() {
  return isOnlineAdminMode() && isAdminLoggedIn.value && Boolean(getGithubToken())
}

// 本地 dev：带 session 头；线上：带 GitHub Token（部分请求走 githubGalleryAdmin）
export function adminFetch(url, options = {}) {
  if (isOnlineAdminMode()) {
    return fetch(url, options)
  }
  const headers = { ...(options.headers || {}) }
  const session = sessionStorage.getItem(SESSION_KEY)
  if (session) headers['X-Admin-Session'] = session
  return fetch(url, { ...options, headers })
}

// 线上：校验 GitHub PAT 是否有效
async function verifyGithubToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error('GitHub 令牌无效或已过期，请重新生成店主二维码')
}

// 线上登录：adminSecret 即为 GitHub PAT（仅店主保存二维码）
async function loginOnline(secret, phone) {
  if (phone !== String(adminPhoneCfg).trim()) {
    throw new Error('仅店主账号可登录管理')
  }
  await verifyGithubToken(secret)
  sessionStorage.setItem(GITHUB_TOKEN_KEY, secret)
  sessionStorage.setItem(SESSION_KEY, 'online')
  isAdminLoggedIn.value = true
  adminPhone.value = phone
  return true
}

// 本地 dev：走 Vite 插件 API
async function loginLocal(secret, phone) {
  const res = await fetch('/api/gallery/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, phone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '登录失败')
  sessionStorage.setItem(SESSION_KEY, data.session)
  isAdminLoggedIn.value = true
  if (data.phone) adminPhone.value = data.phone
  return true
}

async function loginWithSecret(secret, phone) {
  if (isOnlineAdminMode()) return loginOnline(secret, phone)
  return loginLocal(secret, phone)
}

async function validateSession() {
  if (isOnlineAdminMode()) {
    const token = getGithubToken()
    if (!token) {
      isAdminLoggedIn.value = false
      return false
    }
    try {
      await verifyGithubToken(token)
      isAdminLoggedIn.value = true
      return true
    } catch {
      sessionStorage.removeItem(GITHUB_TOKEN_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      isAdminLoggedIn.value = false
      return false
    }
  }
  const session = sessionStorage.getItem(SESSION_KEY)
  if (!session) {
    isAdminLoggedIn.value = false
    return false
  }
  const res = await adminFetch('/api/gallery/auth/check')
  if (!res.ok) {
    sessionStorage.removeItem(SESSION_KEY)
    isAdminLoggedIn.value = false
    return false
  }
  const data = await res.json()
  isAdminLoggedIn.value = true
  if (data.phone) adminPhone.value = data.phone
  return true
}

async function tryLoginFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const secret = params.get('adminLogin')
  if (!secret) return false
  const phone = params.get('adminPhone') || adminPhoneCfg
  await loginWithSecret(secret, phone)
  params.delete('adminLogin')
  params.delete('adminPhone')
  const q = params.toString()
  const next = window.location.pathname + (q ? `?${q}` : '') + window.location.hash
  window.history.replaceState({}, '', next)
  return true
}

export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(GITHUB_TOKEN_KEY)
  isAdminLoggedIn.value = false
}

export async function initAdminAuth() {
  if (!isDev && !isOnlineAdminMode()) {
    isAdminLoggedIn.value = false
    return false
  }
  const hasLoginParam = new URLSearchParams(window.location.search).has('adminLogin')
  if (initDone && !hasLoginParam) return isAdminLoggedIn.value
  initDone = true
  if (hasLoginParam) {
    try {
      await tryLoginFromUrl()
      return isAdminLoggedIn.value
    } catch (e) {
      isAdminLoggedIn.value = false
      window.alert(
        isOnlineAdminMode()
          ? `店主登录失败：${e.message || e}\n\n请确认 admin.config.json 中 adminSecret 为 GitHub 令牌，并重新 npm run gen-admin-qr`
          : `店主登录失败：${e.message || e}\n\n请确认 npm run dev 已启动`
      )
      return false
    }
  }
  await validateSession()
  return isAdminLoggedIn.value
}

export function useAdminAuth() {
  return {
    isAdminLoggedIn,
    adminPhone,
    initAdminAuth,
    isDev,
    isOnlineAdminMode,
    isOwnerGalleryPreview,
  }
}
