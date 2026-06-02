/**
 * 作品集分类配置：sync 与本地管理 API 共用
 */
export const GALLERY_CATEGORIES = [
  { dir: 'caihui', key: 'caihui', category: '彩绘', titlePrefix: '手绘彩绘', folderPrefix: 'c' },
  { dir: 'fashi', key: 'fashi', category: '法式', titlePrefix: '法式款式', folderPrefix: 'f' },
  { dir: 'jianbian', key: 'jianbian', category: '渐变款', titlePrefix: '渐变美甲', folderPrefix: 'j' },
  { dir: 'maoyan', key: 'maoyan', category: '猫眼', titlePrefix: '猫眼星辰', folderPrefix: 'm' },
  { dir: 'zhuti', key: 'zhuti', category: '主题款', titlePrefix: '主题款', folderPrefix: 'z' },
]

// 按 key 查找分类配置
export function findCategoryByKey(key) {
  return GALLERY_CATEGORIES.find((c) => c.key === key) || null
}

// 按 dir 查找分类配置
export function findCategoryByDir(dir) {
  return GALLERY_CATEGORIES.find((c) => c.dir === dir) || null
}
