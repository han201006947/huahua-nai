/**
 * GitHub Actions 构建前写入 deploy.config.json（该文件 gitignore，CI 无本地副本）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 项目根与目标配置文件路径
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(projectRoot, 'deploy.config.json')

// 非 Actions 环境且已有配置时不动，避免覆盖店主本机 deploy.config.json
if (!process.env.GITHUB_ACTIONS && fs.existsSync(configPath)) {
  console.log('>> deploy.config.json 已存在，跳过 CI 写入')
  process.exit(0)
}

// 从 Actions 注入的 GITHUB_REPOSITORY 推导 Pages 地址与仓库 URL
const repo = (process.env.GITHUB_REPOSITORY || '').trim()
if (!repo.includes('/')) {
  console.log('>> 未设置 GITHUB_REPOSITORY，跳过（本地请手动维护 deploy.config.json）')
  process.exit(0)
}

const [owner, name] = repo.split('/')
// 与 han201006947.github.io/huahua-nai 形式一致
const cfg = {
  publicUrl: `https://${owner}.github.io/${name}/`,
  githubRepoUrl: `https://github.com/${repo}.git`,
}

fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8')
console.log('>> 已写入 deploy.config.json')
console.log('>> publicUrl:', cfg.publicUrl)
