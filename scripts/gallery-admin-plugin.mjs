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
          if (req.method === 'GET' && url === '/api/gallery/categories') {
            sendJson(res, 200, { categories: listCategories() })
            return
          }

          if (req.method === 'POST' && url === '/api/gallery/categories') {
            const body = await readJsonBody(req)
            const result = await addCategory(body)
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'GET' && url === '/api/gallery/albums') {
            const albums = await listAlbums()
            sendJson(res, 200, { albums })
            return
          }

          if (req.method === 'POST' && url === '/api/gallery/albums') {
            const body = await readJsonBody(req)
            const result = await addAlbum(body)
            sendJson(res, 200, result)
            return
          }

          const mediaMatch = url.match(/^\/api\/gallery\/albums\/([^/?]+)\/media/)
          if (req.method === 'POST' && mediaMatch) {
            const albumId = decodeURIComponent(mediaMatch[1])
            const body = await readJsonBody(req)
            const result = await addAlbumMedia(albumId, body)
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'DELETE' && mediaMatch) {
            const albumId = decodeURIComponent(mediaMatch[1])
            const body = await readJsonBody(req)
            const result = await deleteAlbumMedia(albumId, body.src)
            sendJson(res, 200, result)
            return
          }

          const delMatch = url.match(/^\/api\/gallery\/albums\/([^/?]+)/)
          if (req.method === 'DELETE' && delMatch) {
            const albumId = decodeURIComponent(delMatch[1])
            const result = await deleteAlbum(albumId)
            sendJson(res, 200, result)
            return
          }

          sendJson(res, 404, { error: '接口不存在' })
        } catch (err) {
          sendJson(res, 400, { error: err.message || String(err) })
        }
      })
    },
  }
}
