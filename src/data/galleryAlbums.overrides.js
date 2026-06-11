// 相册手动覆盖：标题、仅看款式、媒体顺序等（键为相册 id）
export const albumOverrides = {
  'caihui-c1': {
    stylePreview: true,
  },
  'caihui-c5': {
    mediaOrder: [
      './caihui/c5/c51.jpg',
      './caihui/c5/c52.jpg',
      './caihui/c5/c53.jpg',
    ],
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
  // 主题款 3：4 图 + 视频同一相册（路径统一小写 z3，避免 Z3/z3 拆成两个主题）
  'zhuti-z3': {
    title: '主题款 3',
    stylePreview: true,
    mediaOrder: [
      './zhuti/z3/IMG20260609185958.jpg',
      './zhuti/z3/IMG20260609190147.jpg',
      './zhuti/z3/IMG20260609190515.jpg',
      './zhuti/z3/mmexport1781004191774.jpg',
      './zhuti/z3/z35.mp4',
    ],
  },
}
