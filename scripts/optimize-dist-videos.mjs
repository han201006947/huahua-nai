/**
 * 构建后压缩 dist 内视频（H.264 + faststart），并生成 .poster.jpg 封面图
 */
import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)

// 项目根与 Vite 输出目录
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(projectRoot, 'dist')

// 小于该体积（MB）仅生成封面，不再重编码
const SKIP_REENCODE_BELOW_MB = 2.5
// 最长边缩到 720px，手机看美甲视频足够
const MAX_WIDTH = 720
// H.264 质量（越大文件越小，28 为网页常用）
const CRF = 28
// 与 assetUrl.videoPosterUrl 约定一致：m11.mp4 → m11.poster.jpg
const POSTER_SUFFIX = '.poster.jpg'

// 解析 ffmpeg 可执行路径（优先 ffmpeg-static，否则系统 PATH）
async function resolveFfmpegBin() {
  try {
    const mod = await import('ffmpeg-static')
    const bin = mod.default || mod
    if (bin && fs.existsSync(bin)) return bin
  } catch {
    /* 未安装 ffmpeg-static 时用系统 ffmpeg */
  }
  return 'ffmpeg'
}

// 递归收集 dist 内视频文件
function collectVideos(dir, list = []) {
  if (!fs.existsSync(dir)) return list
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) {
      collectVideos(full, list)
      continue
    }
    if (/\.(mp4|mov|webm)$/i.test(name) && !name.includes('.opt.tmp')) {
      list.push(full)
    }
  }
  return list
}

// 由视频路径得到同目录封面图路径
function posterPathFor(videoPath) {
  const ext = path.extname(videoPath)
  return videoPath.slice(0, -ext.length) + POSTER_SUFFIX
}

// 从视频第 0.5 秒截一帧作为 poster（点开详情前即可显示，不必等 mp4）
async function writePoster(ffmpeg, videoPath) {
  const poster = posterPathFor(videoPath)
  if (fs.existsSync(poster)) return poster
  await execFileAsync(ffmpeg, [
    '-y',
    '-ss',
    '0.5',
    '-i',
    videoPath,
    '-vframes',
    '1',
    '-q:v',
    '4',
    '-vf',
    `scale='min(${MAX_WIDTH},iw)':-2`,
    poster,
  ])
  return poster
}

// 用临时文件替换目标（Windows 兼容）
async function replaceFile(targetPath, tempPath) {
  fs.rmSync(targetPath, { force: true })
  fs.renameSync(tempPath, targetPath)
}

// 压缩单个视频：H.264 + moov 前移便于边下边播
async function compressVideo(ffmpeg, filePath) {
  const before = fs.statSync(filePath).size
  await writePoster(ffmpeg, filePath)
  if (before < SKIP_REENCODE_BELOW_MB * 1024 * 1024) {
    return null
  }

  const tempPath = `${filePath}.opt.tmp.mp4`

  try {
    await execFileAsync(ffmpeg, [
      '-y',
      '-i',
      filePath,
      '-vf',
      `scale='min(${MAX_WIDTH},iw)':-2`,
      '-c:v',
      'libx264',
      '-crf',
      String(CRF),
      '-preset',
      'medium',
      '-movflags',
      '+faststart',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-ac',
      '1',
      tempPath,
    ])
  } catch {
    // 无音轨时去掉音频编码再试一次
    await execFileAsync(ffmpeg, [
      '-y',
      '-i',
      filePath,
      '-vf',
      `scale='min(${MAX_WIDTH},iw)':-2`,
      '-c:v',
      'libx264',
      '-crf',
      String(CRF),
      '-preset',
      'medium',
      '-movflags',
      '+faststart',
      '-pix_fmt',
      'yuv420p',
      '-an',
      tempPath,
    ])
  }

  await replaceFile(filePath, tempPath)
  const after = fs.statSync(filePath).size
  if (after >= before) {
    return null
  }
  return { rel: path.relative(distRoot, filePath), before, after }
}

async function main() {
  if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    console.error('>> 请先 vite build 生成 dist')
    process.exit(1)
  }

  const ffmpeg = await resolveFfmpegBin()
  try {
    await execFileAsync(ffmpeg, ['-version'])
  } catch {
    console.warn('>> 未找到 ffmpeg，跳过视频压缩（可 npm i 后重试，或 CI 会自动处理）')
    return
  }

  const files = collectVideos(distRoot)
  let done = 0
  let saved = 0
  let posters = 0

  for (const file of files) {
    try {
      const poster = posterPathFor(file)
      const hadPoster = fs.existsSync(poster)
      const r = await compressVideo(ffmpeg, file)
      if (!hadPoster && fs.existsSync(poster)) posters += 1
      if (r) {
        done += 1
        saved += r.before - r.after
        console.log(
          `>> [视频] ${r.rel}: ${(r.before / 1024 / 1024).toFixed(2)}MB → ${(r.after / 1024 / 1024).toFixed(2)}MB`
        )
      }
    } catch (err) {
      console.warn(`>> 跳过视频 ${path.relative(distRoot, file)}: ${err.message}`)
    }
  }

  console.log(
    `>> 视频压缩 ${done} 个，封面 ${posters} 张，共节省 ${(saved / 1024 / 1024).toFixed(2)}MB`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
