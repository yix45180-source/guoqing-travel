/**
 * 统一图标语义映射（基于 Vant 4 内置 icon name）
 * 用法：<van-icon :name="I.ticket" />
 * 线性风格统一通过 CSS 的 .van-icon 字号控制
 */
export const I = {
  // 通用动作
  success: 'success',       // 已选/完成
  clear: 'clear',            // 取消/清空
  cross: 'cross',
  copy: 'records',           // 复制
  share: 'share',
  back: 'arrow-left',
  forward: 'arrow',
  up: 'arrow-up',
  down: 'arrow-down',
  top: 'back-top',           // 回到顶部
  search: 'search',
  print: 'printer',

  // 出行 / 时间
  train: 'logistics',        // 12306（无 train，用物流近似）
  clock: 'clock-o',          // 时长 / 班次
  calendar: 'calendar-o',   // 预约 / 开售日
  date: 'calendar-o',
  route: 'nav-arrow',         // 路线 / 行程
  location: 'location-o',    // 地点 / 高德
  map: 'location',
  walk: 'friends-o',

  // 票务 / 钱
  ticket: 'coupon-o',        // 门票 / 票务
  money: 'gold-coin-o',      // 花费 / 价格
  balance: 'balance-o',
  student: 'certificate',   // 学生证 / 半价

  // 美食 / 购物
  food: 'thumb-cook-o',       // 美食（烹饪）
  shop: 'shop-o',            // 店铺 / 点评
  cheap: 'gold-coin',        // 平价标记

  // 景点 / 内容
  spot: 'photograph-o',      // 景点 / 照片
  note: 'notes-o',          // 小红书 / 笔记
  bookmark: 'bookmark-o',
  star: 'star-o',
  starOn: 'star',
  fire: 'fire-o',
  flower: 'flower-o',        // 桂花 / 主题日

  // 状态 / 提示
  warn: 'warning-o',
  info: 'info-o',
  question: 'question-o',
  tip: 'bulb-o',             // 贴士 / 提示灯泡
  alert: 'warning',

  // 仪表盘 / 概览
  overview: 'chart-trending-o',
  list: 'orders-o',
  user: 'contact',
  bag: 'shopping-cart-o',
  flag: 'flag-o',
  tag: 'label',
  filter: 'filter-o',
  sort: 'sort',
  refresh: 'replay',
  eye: 'eye-o',
  edit: 'edit',
  delete: 'delete-o',
  add: 'add-o',
  external: 'link-o',        // 外链
}

// 小红书 / 点评 / 高德 三个外链图标
export const LINK_ICONS = {
  xhs: 'notes-o',
  dp: 'shop-o',
  gd: 'location-o',
}
