/**
 * 店主手机写 GitHub 后的回读验证：确认图片与 galleryAlbums 已真正写入/删除
 */
import {
  fetchGalleryAlbumsFromRepo,
  fetchGalleryRevision,
  listRepoDir,
  repoPathExists,
} from './githubContents.js'

// GitHub Contents API 提交后 raw 可能有短暂延迟，轮询几次
const VERIFY_DELAY_MS = 450
const VERIFY_RETRIES = 6

// 等待若干毫秒再重试验证
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// 轮询直到 testFn 返回 true，否则抛出中文错误
async function pollUntil(label, testFn) {
  for (let i = 0; i < VERIFY_RETRIES; i += 1) {
    if (await testFn()) return
    await sleep(VERIFY_DELAY_MS)
  }
  throw new Error(`${label}未在 GitHub 上确认成功，请检查网络后重试（款式列表未改动）`)
}

// 验证多个仓库路径已不存在（404）
export async function verifyRepoPathsAbsent(paths) {
  const list = [...new Set(paths.filter(Boolean))]
  if (!list.length) return
  await pollUntil('删除图片/视频', async () => {
    for (const p of list) {
      if (await repoPathExists(p)) return false
    }
    return true
  })
}

// 验证上传的文件已在仓库中可读
export async function verifyRepoPathsPresent(paths) {
  const list = [...new Set(paths.filter(Boolean))]
  if (!list.length) throw new Error('没有需要验证的上传路径')
  await pollUntil('上传图片/视频', async () => {
    for (const p of list) {
      if (!(await repoPathExists(p))) return false
    }
    return true
  })
}

// 验证分类目录下已无该款式文件夹或单文件（c5、c5.jpg 等）
export async function verifyAlbumPublicGone(catDir, entryName) {
  const parentPath = `public/${catDir}`
  await pollUntil('删除 public 款式文件', async () => {
    let entries = []
    try {
      entries = await listRepoDir(parentPath)
    } catch {
      return true
    }
    const hit = entries.some((e) => {
      const stem = e.name.replace(/\.[^.]+$/, '')
      return e.name === entryName || stem === entryName
    })
    return !hit
  })
}

// 验证 galleryAlbums.js 中已无该 id
export async function verifyAlbumAbsentFromGalleryJs(albumId) {
  await pollUntil('删除款式列表', async () => {
    const albums = await fetchGalleryAlbumsFromRepo()
    return !albums.some((a) => a.id === albumId)
  })
}

// 验证 galleryAlbums.js 中已有该 id
export async function verifyAlbumPresentInGalleryJs(albumId) {
  await pollUntil('添加款式列表', async () => {
    const albums = await fetchGalleryAlbumsFromRepo()
    return albums.some((a) => a.id === albumId)
  })
}

// 验证自建分类目录已从 public 移除
export async function verifyCategoryPublicGone(catDir) {
  await pollUntil('删除分类目录', async () => !(await repoPathExists(`public/${catDir}`)))
}

// 验证 revision.latestIds 是否包含/不含某 id
export async function verifyLatestIdsForAlbum(albumId, shouldContain) {
  await pollUntil('最新款式 revision', async () => {
    const rev = await fetchGalleryRevision()
    const has = (rev.latestIds || []).includes(albumId)
    return shouldContain ? has : !has
  })
}
