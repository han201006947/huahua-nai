/**
 * Vite 开发服务器插件：作品集增删 API（仅 npm run dev，不会打进线上 build）
 */
import {
  addAlbum,
  addAlbumMedia,
  addCategory,
  deleteAlbum,
  deleteAlbumMedia,
  listAlbums,
  listCategories,
  readJsonBody,
  sendJson,
} from './gallery-admin-api.mjs'
import {
  buildAdminLoginUrl,
  getSessionIdFromReq,
  loginAdmin,
  requireAdminSession,
  verifySession,
} from './admin-auth.mjs'

// 写操作前校验店主 session
function assertAdmin(req) {
  requireAdminSession(req)
}

// 注册 /api/gallery/* 路由
export function galleryAdminPlugin() {
  return {
    name: 'gallery-admin-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/gallery')) return next()

        try {
          // --- 店主登录 ---
          if (req.method === 'POST' && url === '/api/gallery/auth/login') {
            const body = await readJsonBody(req, 1024 * 64)
            const result = loginAdmin(body)
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'GET' && url === '/api/gallery/auth/check') {
            const row = verifySession(getSessionIdFromReq(req))
            if (!row) {
              sendJson(res, 401, { error: '未登录' })
              return
            }
            sendJson(res, 200, { ok: true, phone: row.phone })
            return
          }

          if (req.method === 'GET' && url.startsWith('/api/gallery/auth/login-url')) {
            const origin = `http://${req.headers.host || 'localhost:5173'}`
            sendJson(res, 200, { loginUrl: buildAdminLoginUrl(origin) })
            return
          }

          // --- 只读（顾客/未登录也可看列表） ---
          if (req.method === 'GET' && url === '/api/gallery/categories') {
            sendJson(res, 200, { categories: listCategories() })
            return
          }

          if (req.method === 'GET' && url === '/api/gallery/albums') {
            const albums = await listAlbums()
            sendJson(res, 200, { albums })
            return
          }

          // --- 以下写操作需店主登录 ---
          if (req.method === 'POST' && url === '/api/gallery/categories') {
            assertAdmin(req)
            const body = await readJsonBody(req)
            const result = await addCategory(body)
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'POST' && url === '/api/gallery/albums') {
            assertAdmin(req)
            const body = await readJsonBody(req)
            const result = await addAlbum(body)
            sendJson(res, 200, result)
            return
          }

          const mediaMatch = url.match(/^\/api\/gallery\/albums\/([^/?]+)\/media/)
          if (req.method === 'POST' && mediaMatch) {
            assertAdmin(req)
            const albumId = decodeURIComponent(mediaMatch[1])
            const body = await readJsonBody(req)
            const result = await addAlbumMedia(albumId, body)
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'DELETE' && mediaMatch) {
            assertAdmin(req)
            const albumId = decodeURIComponent(mediaMatch[1])
            const body = await readJsonBody(req)
            const result = await deleteAlbumMedia(albumId, body.src)
            sendJson(res, 200, result)
            return
          }

          const delMatch = url.match(/^\/api\/gallery\/albums\/([^/?]+)/)
          if (req.method === 'DELETE' && delMatch) {
            assertAdmin(req)
            const albumId = decodeURIComponent(delMatch[1])
            const result = await deleteAlbum(albumId)
            sendJson(res, 200, result)
            return
          }

          sendJson(res, 404, { error: '接口不存在' })
        } catch (err) {
          const status = err.status || 400
          sendJson(res, status, { error: err.message || String(err) })
        }
      })
    },
  }
}
