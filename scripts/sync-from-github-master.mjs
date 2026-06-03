/**
 * 从 GitHub master 拉取 galleryAlbums.js、revision 与缺失 public 资源（git pull 失败时用）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const deployCfg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'deploy.config.json'), 'utf8')
)
const m = (deployCfg.githubRepoUrl || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
if (!m) {
  console.error('>> deploy.config.json 缺少 githubRepoUrl')
  process.exit(1)
}
const owner = m[1]
const repo = m[2].replace(/\.git$/, '')
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/master`

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

async function fetchBinary(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  console.log(`>> 已下载 ${path.relative(projectRoot, dest)} (${(buf.length / 1024 / 1024).toFixed(2)}MB)`)
}

async function main() {
  const albumsJs = await fetchText(`${rawBase}/src/data/galleryAlbums.js`)
  fs.writeFileSync(path.join(projectRoot, 'src/data/galleryAlbums.js'), albumsJs)
  console.log('>> 已同步 src/data/galleryAlbums.js')

  const rev = await fetchText(`${rawBase}/public/gallery-revision.json`)
  fs.writeFileSync(path.join(projectRoot, 'public/gallery-revision.json'), rev)
  console.log('>> 已同步 public/gallery-revision.json')

  const revData = JSON.parse(rev)
  for (const id of revData.latestIds || []) {
    const dash = id.indexOf('-')
    if (dash < 1) continue
    const catKey = id.slice(0, dash)
    const entry = id.slice(dash + 1)
    const catDirs = { caihui: 'caihui', fashi: 'fashi', maoyan: 'maoyan', jianbian: 'jianbian', zhuti: 'zhuti' }
    const dir = catDirs[catKey]
    if (!dir) continue
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/${dir}/${entry}?ref=master`
    const res = await fetch(apiUrl)
    if (!res.ok) continue
    const entries = await res.json()
    if (!Array.isArray(entries)) continue
    for (const ent of entries) {
      if (ent.type !== 'file' || !ent.download_url) continue
      const rel = ent.path.replace(/^public\//, '')
      const dest = path.join(projectRoot, 'public', rel)
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) continue
      await fetchBinary(ent.download_url, dest)
    }
  }
  console.log('>> 完成。请 npm run build && git push origin master')
}

main().catch((e) => {
  console.error('>> 同步失败:', e.message || e)
  process.exit(1)
})
