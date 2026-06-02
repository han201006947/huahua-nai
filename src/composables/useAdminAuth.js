/**
 * 店主管理登录状态（仅 dev + 有效 session 时可改款式）
 */
import { ref } from 'vue'

const SESSION_KEY = 'gallery-admin-session'
const isDev = import.meta.env.DEV

const isAdminLoggedIn = ref(false)
const adminPhone = ref('15235952769')
let initDone = false

// 带 session 头的 fetch
export function adminFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) }
  const session = sessionStorage.getItem(SESSION_KEY)
  if (session) headers['X-Admin-Session'] = session
  return fetch(url, { ...options, headers })
}

// 用密钥登录并保存 session
async function loginWithSecret(secret, phone) {
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

// 校验已保存 session 是否仍有效
async function validateSession() {
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

// 从 URL ?adminLogin= 参数完成扫码登录
async function tryLoginFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const secret = params.get('adminLogin')
  if (!secret) return false
  const phone = params.get('adminPhone') || '15235952769'
  try {
    await loginWithSecret(secret, phone)
    params.delete('adminLogin')
    params.delete('adminPhone')
    const q = params.toString()
    const next = window.location.pathname + (q ? `?${q}` : '') + window.location.hash
    window.history.replaceState({}, '', next)
    return true
  } catch {
    return false
  }
}

// 退出登录
export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY)
  isAdminLoggedIn.value = false
}

export function useAdminAuth() {
  // 初始化：URL 扫码登录或校验旧 session
  async function initAdminAuth() {
    if (!isDev) {
      isAdminLoggedIn.value = false
      return
    }
    if (initDone) return
    initDone = true
    await tryLoginFromUrl()
    if (!isAdminLoggedIn.value) await validateSession()
  }

  return {
    isAdminLoggedIn,
    adminPhone,
    initAdminAuth,
    isDev,
  }
}
