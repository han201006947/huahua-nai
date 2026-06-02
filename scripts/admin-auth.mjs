/**
 * 店主管理登录：仅 admin.config.json 中手机号+密钥可换取会话
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// 内存会话：sessionId -> { phone, expiresAt }
const sessions = new Map()

// 会话有效期 7 天
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

// 读取 admin.config.json（不存在则用 example）
export function loadAdminConfig() {
  const localPath = path.join(projectRoot, 'admin.config.json')
  const examplePath = path.join(projectRoot, 'admin.config.example.json')
  const file = fs.existsSync(localPath) ? localPath : examplePath
  if (!fs.existsSync(file)) {
    return { adminPhone: '15235952769', adminSecret: 'huahua-default-change-me' }
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// 从请求头读取 session id
export function getSessionIdFromReq(req) {
  const raw = req.headers['x-admin-session'] || req.headers['X-Admin-Session']
  return typeof raw === 'string' ? raw.trim() : ''
}

// 校验 session 是否有效且为店主
export function verifySession(sessionId) {
  if (!sessionId) return null
  const row = sessions.get(sessionId)
  if (!row) return null
  if (Date.now() > row.expiresAt) {
    sessions.delete(sessionId)
    return null
  }
  return row
}

// 未登录则抛出错误（供 API 中间件用）
export function requireAdminSession(req) {
  const sessionId = getSessionIdFromReq(req)
  const row = verifySession(sessionId)
  if (!row) {
    const err = new Error('请先使用店主微信扫码登录后再操作')
    err.status = 401
    throw err
  }
  return row
}

// 登录：校验手机号与密钥，签发 session
export function loginAdmin(payload) {
  const cfg = loadAdminConfig()
  const phone = String(payload?.phone || '').trim()
  const secret = String(payload?.secret || '').trim()
  if (phone !== String(cfg.adminPhone || '').trim()) {
    const err = new Error('仅店主账号可登录管理')
    err.status = 403
    throw err
  }
  if (secret !== String(cfg.adminSecret || '').trim()) {
    const err = new Error('登录验证失败')
    err.status = 403
    throw err
  }
  const sessionId = crypto.randomBytes(24).toString('hex')
  sessions.set(sessionId, {
    phone,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })
  return { session: sessionId, phone, expiresInDays: 7 }
}

// 构建店主扫码登录 URL（dev 用当前站点 origin）
export function buildAdminLoginUrl(origin) {
  const cfg = loadAdminConfig()
  const base = (origin || 'http://localhost:5173').replace(/\/$/, '')
  const q = new URLSearchParams({
    adminLogin: cfg.adminSecret,
    adminPhone: cfg.adminPhone,
  })
  return `${base}/?${q.toString()}#gallery`
}
