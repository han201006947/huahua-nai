/**
 * 店主管理登录状态（仅 dev + 有效 session 时可改款式）
 */
import { ref } from 'vue'

// sessionStorage 键名
const SESSION_KEY = 'gallery-admin-session'
// 是否开发环境
const isDev = import.meta.env.DEV

// 是否已登录（模块级共享，各组件读到同一状态）
const isAdminLoggedIn = ref(false)
// 店主手机号展示
const adminPhone = ref('15235952769')
// 是否已完成一次初始化（扫码链接会强制再登一次）
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
  await loginWithSecret(secret, phone)
  params.delete('adminLogin')
  params.delete('adminPhone')
  const q = params.toString()
  const next = window.location.pathname + (q ? `?${q}` : '') + window.location.hash
  window.history.replaceState({}, '', next)
  return true
}

// 退出登录
export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY)
  isAdminLoggedIn.value = false
}

// 应用启动时尽早执行：扫码登录或校验旧 session（须在 mount 前 await）
export async function initAdminAuth() {
  if (!isDev) {
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
        `店主登录失败：${e.message || e}\n\n请确认：\n1. 电脑已运行 npm run dev\n2. 手机与电脑同一 WiFi\n3. 二维码用局域网地址生成：npm run gen-admin-qr http://电脑IP:5173`
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
  }
}
