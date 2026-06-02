/**
 * 作品集分类：内置 + 自定义（galleryCategories.custom.json）合并
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const customJsonPath = path.join(projectRoot, 'src', 'data', 'galleryCategories.custom.json')

// 内置分类（与 public 下原有文件夹对应）
export const BUILTIN_GALLERY_CATEGORIES = [
  { dir: 'caihui', key: 'caihui', category: '彩绘', titlePrefix: '贴纸彩绘', folderPrefix: 'c' },
  { dir: 'fashi', key: 'fashi', category: '法式', titlePrefix: '法式款式', folderPrefix: 'f' },
  { dir: 'jianbian', key: 'jianbian', category: '渐变款', titlePrefix: '渐变美甲', folderPrefix: 'j' },
  { dir: 'maoyan', key: 'maoyan', category: '猫眼', titlePrefix: '猫眼星辰', folderPrefix: 'm' },
  { dir: 'zhuti', key: 'zhuti', category: '主题款', titlePrefix: '主题款', folderPrefix: 'z' },
]

// 读取用户新增分类 JSON
export function loadCustomCategories() {
  if (!fs.existsSync(customJsonPath)) return []
  try {
    const list = JSON.parse(fs.readFileSync(customJsonPath, 'utf8'))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// 写入用户新增分类 JSON
export function saveCustomCategories(list) {
  fs.writeFileSync(customJsonPath, JSON.stringify(list, null, 2) + '\n', 'utf8')
}

// 合并内置与自定义分类
export function getAllCategories() {
  return [...BUILTIN_GALLERY_CATEGORIES, ...loadCustomCategories()]
}

// 兼容旧引用
export const GALLERY_CATEGORIES = BUILTIN_GALLERY_CATEGORIES

// 按 key 查找分类
export function findCategoryByKey(key) {
  return getAllCategories().find((c) => c.key === key) || null
}

// 按 dir 查找分类
export function findCategoryByDir(dir) {
  return getAllCategories().find((c) => c.dir === dir) || null
}

// 返回 custom.json 路径（API 用）
export function getCustomCategoriesPath() {
  return customJsonPath
}
