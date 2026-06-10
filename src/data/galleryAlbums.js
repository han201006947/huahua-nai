// 穿戴甲贴手示意文案：戴在手上仅看款式，非店内实拍服务
export const STYLE_PREVIEW_LABEL = {
  badgeEn: 'PRESS-ON DISPLAY',
  badgeZh: '仅看款式',
  notice: '穿戴甲贴手展示 · 仅看款式',
}

// 作品相册：由 scripts/sync-gallery-albums.mjs 根据 public 文件夹自动生成
// 更新 public 后运行 npm run sync-gallery；标题/仅看款式等见 galleryAlbums.overrides.js
export const galleryAlbums = [
  {
    id: 'caihui-c1',
    title: '贴纸彩绘 1',
    category: '彩绘',
    cover: './caihui/c1/c11.jpg',
    hasVideo: true,
    stylePreview: true,
    media: [
      { type: 'image', src: './caihui/c1/c11.jpg' },
      { type: 'image', src: './caihui/c1/c12.jpg' },
      { type: 'video', src: './caihui/c1/c13.mp4' },
    ],
  },
  {
    id: 'caihui-c2',
    title: '贴纸彩绘 2',
    category: '彩绘',
    cover: './caihui/c2.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './caihui/c2.jpg' },
    ],
  },
  {
    id: 'caihui-c3',
    title: '贴纸彩绘 3',
    category: '彩绘',
    cover: './caihui/c3.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './caihui/c3.jpg' },
    ],
  },
  {
    id: 'caihui-c4',
    title: '贴纸彩绘 4',
    category: '彩绘',
    cover: './caihui/c4.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './caihui/c4.jpg' },
    ],
  },
  {
    id: 'fashi-f1',
    title: '法式经典',
    category: '法式',
    cover: './fashi/f1/IMG20260531202437.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './fashi/f1/IMG20260531202437.jpg' },
      { type: 'image', src: './fashi/f1/IMG20260531202441.jpg' },
      { type: 'image', src: './fashi/f1/IMG20260531202334.jpg' },
    ],
  },
  {
    id: 'fashi-f2',
    title: '法式款式',
    category: '法式',
    cover: './fashi/f2/f21.jpg',
    hasVideo: false,
    stylePreview: true,
    media: [
      { type: 'image', src: './fashi/f2/f21.jpg' },
    ],
  },
  {
    id: 'jianbian-j1',
    title: '渐变美甲 1',
    category: '渐变款',
    cover: './jianbian/j1.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './jianbian/j1.jpg' },
    ],
  },
  {
    id: 'jianbian-j2',
    title: '渐变美甲 2',
    category: '渐变款',
    cover: './jianbian/j2.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './jianbian/j2.jpg' },
    ],
  },
  {
    id: 'jianbian-j3',
    title: '渐变美甲 3',
    category: '渐变款',
    cover: './jianbian/j3.jpg',
    hasVideo: false,
    stylePreview: true,
    media: [
      { type: 'image', src: './jianbian/j3.jpg' },
    ],
  },
  {
    id: 'jianbian-j4',
    title: '渐变美甲 4',
    category: '渐变款',
    cover: './jianbian/j4.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './jianbian/j4.jpg' },
    ],
  },
  {
    id: 'jianbian-j5',
    title: '渐变美甲 5',
    category: '渐变款',
    cover: './jianbian/j5.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './jianbian/j5.jpg' },
    ],
  },
  {
    id: 'maoyan-m1',
    title: '猫眼星辰 1',
    category: '猫眼',
    cover: './maoyan/m1/m12.jpg',
    hasVideo: true,
    media: [
      { type: 'image', src: './maoyan/m1/m12.jpg' },
      { type: 'video', src: './maoyan/m1/m11.mp4' },
    ],
  },
  {
    id: 'maoyan-m3',
    title: '猫眼星辰 2',
    category: '猫眼',
    cover: './maoyan/m3/m31.jpg',
    hasVideo: true,
    media: [
      { type: 'image', src: './maoyan/m3/m31.jpg' },
      { type: 'video', src: './maoyan/m3/m32.mp4' },
    ],
  },
  {
    id: 'maoyan-m4',
    title: '猫眼星辰 3',
    category: '猫眼',
    cover: './maoyan/m4.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './maoyan/m4.jpg' },
    ],
  },
  {
    id: 'maoyan-m5',
    title: '猫眼星辰 4',
    category: '猫眼',
    cover: './maoyan/m5.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './maoyan/m5.jpg' },
    ],
  },
  {
    id: 'maoyan-m6',
    title: '猫眼星辰 5',
    category: '猫眼',
    cover: './maoyan/m6.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './maoyan/m6.jpg' },
    ],
  },
  {
    id: 'maoyan-m7',
    title: '猫眼星辰 6',
    category: '猫眼',
    cover: './maoyan/m7/m71.jpg',
    hasVideo: true,
    media: [
      { type: 'image', src: './maoyan/m7/m71.jpg' },
      { type: 'video', src: './maoyan/m7/m72.mp4' },
    ],
  },
  {
    id: 'maoyan-m8',
    title: '猫眼星辰 7',
    category: '猫眼',
    cover: './maoyan/m8/m81.jpg',
    hasVideo: true,
    media: [
      { type: 'image', src: './maoyan/m8/m81.jpg' },
      { type: 'video', src: './maoyan/m8/m82.mp4' },
      { type: 'video', src: './maoyan/m8/m83.mp4' },
      { type: 'video', src: './maoyan/m8/m84.mp4' },
    ],
  },
  {
    id: 'maoyan-m9',
    title: '猫眼星辰 8',
    category: '猫眼',
    cover: './maoyan/m9/m91.jpg',
    hasVideo: true,
    media: [
      { type: 'image', src: './maoyan/m9/m91.jpg' },
      { type: 'video', src: './maoyan/m9/m92.mp4' },
    ],
  },
  {
    id: 'maoyan-m10',
    title: '猫眼星辰 9',
    category: '猫眼',
    coverVideo: './maoyan/m10/m101.mp4',
    cover: './maoyan/m10/m101.mp4',
    hasVideo: true,
    videoOnly: true,
    media: [
      { type: 'video', src: './maoyan/m10/m101.mp4' },
    ],
  },
  {
    id: 'zhuti-z1',
    title: '主题定制',
    category: '主题款',
    cover: './zhuti/z1/z11.jpg',
    hasVideo: false,
    media: [
      { type: 'image', src: './zhuti/z1/z11.jpg' },
      { type: 'image', src: './zhuti/z1/z12.jpg' },
    ],
  },
  {
    id: 'zhuti-z2-jiehun',
    title: '婚礼主题',
    category: '主题款',
    coverVideo: './zhuti/z2-jiehun.mp4',
    cover: './zhuti/z2-jiehun.mp4',
    hasVideo: true,
    videoOnly: true,
    media: [
      { type: 'video', src: './zhuti/z2-jiehun.mp4' },
    ],
  },
  {
    id: 'zhuti-z3',
    title: '主题款 3',
    category: '主题款',
    cover: './zhuti/z3/IMG20260609185958.jpg',
    hasVideo: false,
    stylePreview: true,
    media: [
      { type: 'image', src: './zhuti/z3/IMG20260609185958.jpg' },
      { type: 'image', src: './zhuti/z3/IMG20260609190147.jpg' },
      { type: 'image', src: './zhuti/z3/IMG20260609190515.jpg' },
      { type: 'image', src: './zhuti/z3/mmexport1781004191774.jpg' },
    ],
  },
]
