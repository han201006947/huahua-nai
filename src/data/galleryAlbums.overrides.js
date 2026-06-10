// 相册手动覆盖：标题、仅看款式、媒体顺序等（键为相册 id）
export const albumOverrides = {
  'caihui-c1': {
    stylePreview: true,
  },
  'fashi-f1': {
    title: '法式经典',
    mediaOrder: [
      './fashi/f1/IMG20260531202437.jpg',
      './fashi/f1/IMG20260531202441.jpg',
      './fashi/f1/IMG20260531202334.jpg',
    ],
  },
  'fashi-f2': {
    title: '法式款式',
    stylePreview: true,
  },
  'jianbian-j3': {
    stylePreview: true,
  },
  'zhuti-z1': {
    title: '主题定制',
  },
  'zhuti-z2-jiehun': {
    title: '婚礼主题',
  },
  'zhuti-z3': {
    stylePreview: true,
  },
  // Windows 文件夹名为 Z3，sync 生成 id 为 zhuti-Z3
  'zhuti-Z3': {
    title: '主题款 3',
    stylePreview: true,
  },
}
