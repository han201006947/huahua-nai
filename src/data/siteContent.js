// 站点静态文案与业务数据，集中管理便于后续替换真实内容
export const brand = {
  // 品牌中文名
  name: '花花美甲坊',
  // 品牌英文副标题（个人工作室定位）
  tagline: 'Personal Nail Studio',
  // 品牌一句话 Slogan
  slogan: '让每一根指尖，都绽放你的独特光彩',
  // 首页 Hero 角标文案
  heroBadge: '✦ 个人美甲 · 用心定制 ✦',
  // 首页主标题下方副标题
  heroSubtitle: '个人美甲工作室',
  // 首页简介段落（含完整上门地址，便于访客识别个人工作室位置）
  heroDesc:
    '个人美甲工作室，位于河北省石家庄市栾城区郄马镇胜春苑西区28号楼3单元901。预约制一对一服务，坚持选用安全材料，从基础护理到造型定制，为您打造独一无二的指尖美学。',
}

// 首页 Hero 右侧固定宣传图（价目宣传单，完整展示不裁剪）
export const heroImage = '/hb.jpg'

// 首页「本月热门」随机展示的本地作品图（离线可用，Hero 已改用 heroImage 固定图）
export const heroHotImages = [
  '/hb.jpg',
  '/jianbian/j1.jpg',
  '/maoyan/m8/m81.jpg',
  '/fashi/f1/IMG20260531202334.jpg',
  '/caihui/c2.jpg',
  '/zhuti/z1/z11.jpg',
]

// 导航菜单项：id 对应页面锚点
export const navItems = [
  { id: 'home', label: '首页' },
  { id: 'services', label: '服务项目' },
  { id: 'gallery', label: '作品展示' },
  { id: 'about', label: '关于我们' },
  { id: 'contact', label: '预约联系' },
]

// 服务项目列表
export const services = [
  {
    // 服务唯一标识
    id: 'basic',
    // 服务名称
    title: '基础美甲护理',
    // 服务简介
    desc: '修型、去死皮、抛光、营养油护理，打造健康亮泽的指甲基底。暂未开通，敬请期待。',
    // 参考价格
    price: '¥29.9',
    // 装饰用 emoji 图标
    icon: '✨',
    // 暂未开通，后续计划上线
    comingSoon: true,
  },
  {
    id: 'solid',
    title: '纯色本甲',
    desc: '本甲单色上色，简约百搭，适合日常通勤与轻量护理。',
    price: '¥49.9',
    icon: '💅',
  },
  {
    id: 'styled',
    title: '造型本甲',
    desc: '本甲精细修型与款式造型，展现个性指尖美感。',
    price: '¥69.9',
    icon: '🎀',
  },
  {
    id: 'full-tip',
    title: '全贴造型款式',
    desc: '全贴甲片搭配造型款式，快速塑形，效果饱满持久。',
    price: '¥99',
    icon: '💎',
  },
  {
    id: 'half-tip',
    title: '半贴造型款式',
    desc: '半贴延长自然贴合，可做各类造型与花纹设计。',
    price: '¥129',
    icon: '✨',
  },
  {
    id: 'bridal',
    title: '新娘美甲套餐',
    desc: '婚礼专属设计，精致持久，与婚纱造型完美呼应。',
    price: '¥139 起',
    icon: '👰',
  },
]

// 作品相册数据见 src/data/galleryAlbums.js（按文件夹组织，点击进入查看照片与视频）

// 品牌亮点数据（贴合个人工作室规模）
export const highlights = [
  { value: '1+', label: '年美甲经验' },
  { value: '10+', label: '满意客户' },
  { value: '100%', label: '安全材料' },
  { value: '1v1', label: '预约专属服务' },
]

// 「关于我们」区块文案
export const aboutContent = {
  // 区块标题
  title: '关于花花美甲坊',
  // 品牌故事段落
  paragraphs: [
    '「花花美甲坊」是我个人的美甲工作室，位于河北省石家庄市栾城区郄马镇胜春苑西区28号楼3单元901。因热爱美甲而起步，希望把每一次护理与彩绘，都当作与朋友分享美的时光。',
    '工作室采取预约制，每次只接待一位客人，环境安静舒适。从材料选用到每一步操作，都亲自把关，用心对待每一双手。来访前请先微信或电话预约，确认时间后再上门。',
  ],
}

// 服务承诺要点（个人工作室表述）
export const promises = [
  {
    icon: '🛡️',
    title: '安全卫生',
    desc: '一客一消毒，工具高温灭菌，让您安心享受美甲时光。',
  },
  {
    icon: '🌿',
    title: '环保材料',
    desc: '精选低刺激、低气味甲油胶，呵护指甲健康。',
  },
  {
    icon: '💅',
    title: '用心手艺',
    desc: '多年美甲经验，坚持学习提升，每款设计都亲力亲为。',
  },
  {
    icon: '💝',
    title: '预约独享',
    desc: '预约制一对一服务，全程专注您的需求，不赶工、不敷衍。',
  },
]

// 联系与工作室信息
export const contactInfo = {
  // 完整上门地址（个人家庭工作室，胜春苑西区）
  address: '河北省石家庄市栾城区郄马镇胜春苑西区28号楼3单元901',
  // 百度地图搜索链接，方便访客一键导航
  mapUrl:
    'https://map.baidu.com/search/河北省石家庄市栾城区郄马镇胜春苑西区28号楼3单元901',
  phone: '15235952769',
  wechat: '15235952769',
  hours: '周一至周日 10:00 - 21:00',
  // 预约区块说明：引导扫码或电话微信联系
  sectionDesc: '扫描右侧微信二维码或电话联系我，确认时间后欢迎来访。',
  // 左侧信息卡标题
  infoTitle: '工作室地址',
  // 微信扫码卡：图片路径与展示文案
  wechatQr: '/wechat-qr.png',
  wechatQrAlt: '花花美甲坊微信预约二维码',
  wechatCardTitle: '微信扫码预约',
  wechatCardDesc: '请使用微信扫一扫，添加好友后发送「预约 + 姓名 + 期望日期 + 项目」即可。',
  wechatQrHint: '扫一扫，添加我为朋友',
}
