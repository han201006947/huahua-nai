/**
 * 构建后压缩 dist 内大图：手机网页无需 10MB+ 原图，显著加快首屏与作品集加载
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
// 小于该体积（字节）的图跳过，避免反复压小图
const SKIP_BELOW_BYTES = 280 * 1024
// 价目一览主图文件名
const HERO_FILE = 'hb.jpg'

// 收集目录下所有待处理图片路径
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
    list.push(full)
  }
  return list
}

// 按用途返回最大宽度与 JPEG 质量
function getProfile(filePath) {
  const base = path.basename(filePath).toLowerCase()
  if (base === HERO_FILE) {
    return { maxWidth: 1200, quality: 82, label: '价目主图' }
  }
  return { maxWidth: 960, quality: 78, label: '作品/页面图' }
}

// 压缩单张：先写出临时文件，再删原图并替换（兼容 Windows 锁文件）
async function optimizeOne(filePath) {
  const before = fs.statSync(filePath).size
  if (before < SKIP_BELOW_BYTES) return null

  const { maxWidth, quality, label } = getProfile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const tempPath = path.join(
    path.dirname(filePath),
    `._opt_${Date.now()}_${path.basename(filePath)}`
  )

  // 先读入内存再处理，避免 Windows 下 sharp 占用原文件导致无法替换
  const inputBuf = fs.readFileSync(filePath)
  let pipeline = sharp(inputBuf).rotate()
  const meta = await pipeline.metadata()
  if ((meta.width || 0) > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }

  if (ext === '.png') {
    await pipeline.png({ compressionLevel: 9 }).toFile(tempPath)
  } else if (ext === '.webp') {
    await pipeline.webp({ quality: 82 }).toFile(tempPath)
  } else {
    await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tempPath)
  }

  const after = fs.statSync(tempPath).size
  if (after >= before) {
    fs.rmSync(tempPath, { force: true })
    return null
  }
  fs.rmSync(filePath, { force: true })
  fs.renameSync(tempPath, filePath)
  const rel = path.relative(distRoot, filePath)
  return { rel, before, after, label }
}

async function main() {
  if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    console.error('>> 请先 npm run build（vite）生成 dist')
    process.exit(1)
  }

  const files = collectImages(distRoot)
  let done = 0
  let saved = 0

  for (const file of files) {
    try {
      const r = await optimizeOne(file)
      if (!r) continue
      done += 1
      saved += r.before - r.after
      console.log(
        `>> [${r.label}] ${r.rel}: ${(r.before / 1024 / 1024).toFixed(2)}MB → ${(r.after / 1024 / 1024).toFixed(2)}MB`
      )
    } catch (err) {
      console.warn(`>> 跳过 ${path.relative(distRoot, file)}: ${err.message}`)
    }
  }

  console.log(`>> 图片压缩完成：${done} 张，共节省 ${(saved / 1024 / 1024).toFixed(2)}MB`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
