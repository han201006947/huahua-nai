/**
 * 构建后压缩 dist 内大图，并生成作品集网格用 .thumb 缩略图（约 400px）
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 项目根目录
const projectRoot = path.resolve(__dirname, '..')
// Vite 输出目录
const distRoot = path.join(projectRoot, 'dist')
// 小于该体积（字节）的图仍生成 thumb，但跳过主图压缩
const SKIP_MAIN_BELOW_BYTES = 200 * 1024
// 价目一览主图
const HERO_FILE = 'hb.jpg'
// 缩略图后缀：c11.jpg → c11.thumb.jpg
const THUMB_SUFFIX = '.thumb'

// 递归收集 dist 内所有图片
function collectImages(dir, list = []) {
  if (!fs.existsSync(dir)) return list
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) {
      collectImages(full, list)
      continue
    }
    const ext = path.extname(name).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue
    if (name.includes(THUMB_SUFFIX)) continue
    list.push(full)
  }
  return list
}

// 主图压缩参数：价目图略大，作品详情图中等
function getMainProfile(filePath) {
  const base = path.basename(filePath).toLowerCase()
  if (base === HERO_FILE) {
    return { maxWidth: 900, quality: 80, label: '价目主图' }
  }
  return { maxWidth: 720, quality: 76, label: '作品图' }
}

// 缩略图路径
function thumbPath(filePath) {
  const ext = path.extname(filePath)
  const stem = filePath.slice(0, -ext.length)
  return `${stem}${THUMB_SUFFIX}${ext}`
}

// 写出临时文件后替换目标（Windows 兼容）
async function replaceFile(filePath, writeFn) {
  const tempPath = path.join(
    path.dirname(filePath),
    `._opt_${Date.now()}_${path.basename(filePath)}`
  )
  await writeFn(tempPath)
  fs.rmSync(filePath, { force: true })
  fs.renameSync(tempPath, filePath)
}

// 压缩主图
async function optimizeMain(filePath) {
  const before = fs.statSync(filePath).size
  if (before < SKIP_MAIN_BELOW_BYTES) return null

  const { maxWidth, quality, label } = getMainProfile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const inputBuf = fs.readFileSync(filePath)

  await replaceFile(filePath, async (tempPath) => {
    let pipeline = sharp(inputBuf).rotate()
    const meta = await pipeline.metadata()
    if ((meta.width || 0) > maxWidth) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
    }
    if (ext === '.png') {
      await pipeline.png({ compressionLevel: 9 }).toFile(tempPath)
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 80 }).toFile(tempPath)
    } else {
      await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tempPath)
    }
  })

  const after = fs.statSync(filePath).size
  if (after >= before) return null
  return { rel: path.relative(distRoot, filePath), before, after, label }
}

// 生成网格封面用缩略图（仅 JPEG/PNG）
async function writeThumb(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null
  if (path.basename(filePath).toLowerCase() === HERO_FILE) return null

  const out = thumbPath(filePath)
  const inputBuf = fs.readFileSync(filePath)
  const tempPath = `${out}.tmp`

  await sharp(inputBuf)
    .rotate()
    .resize({ width: 420, withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true })
    .toFile(tempPath)

  fs.rmSync(out, { force: true })
  fs.renameSync(tempPath, out)
  return path.relative(distRoot, out)
}

async function main() {
  if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    console.error('>> 请先 npm run build（vite）生成 dist')
    process.exit(1)
  }

  const files = collectImages(distRoot)
  let mainDone = 0
  let thumbDone = 0
  let saved = 0

  for (const file of files) {
    try {
      const r = await optimizeMain(file)
      if (r) {
        mainDone += 1
        saved += r.before - r.after
        console.log(
          `>> [${r.label}] ${r.rel}: ${(r.before / 1024 / 1024).toFixed(2)}MB → ${(r.after / 1024 / 1024).toFixed(2)}MB`
        )
      }
      const thumbRel = await writeThumb(file)
      if (thumbRel) {
        thumbDone += 1
        const kb = (fs.statSync(path.join(distRoot, thumbRel)).size / 1024).toFixed(0)
        console.log(`>> [缩略图] ${thumbRel} (${kb}KB)`)
      }
    } catch (err) {
      console.warn(`>> 跳过 ${path.relative(distRoot, file)}: ${err.message}`)
    }
  }

  console.log(`>> 主图压缩 ${mainDone} 张，缩略图 ${thumbDone} 张，共节省 ${(saved / 1024 / 1024).toFixed(2)}MB`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
