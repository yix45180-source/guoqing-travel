import { reactive, computed } from 'vue'
import { CITIES, HOLIDAYS, RT, ORDER, FARE, TICKET, HZ_THEMES, RESERVATIONS, MAP_POINTS } from './data.js'

function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v === null || v === undefined ? fallback : v
  } catch (e) { return fallback }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) {} }

const saved = loadJSON('tripState', {})

export const state = reactive({
  picked: loadJSON('tripPicked', []),
  reservationPicked: loadJSON('reservationPicked', []),
  tripStart: saved.start || '2026-10-01',
  fillDays: saved.fillDays || 7,
  curHol: saved.hol || 'gq',
  stu: typeof saved.stu === 'boolean' ? saved.stu : true,
  peakHz: true,
  mode: 'fill',
  dayCount: 7,
  dayAuto: true,
  foodFilter: 'all',
  cityFilter: 'all',
  openCity: {},
  planSlots: [],
  leftover: [],
  activeTab: 'pick',
  showReserveRoute: false,
  reserveDirty: false,
  // 'auto' | 'light' | 'dark' — 主题切换；与 data-theme 属性联动，覆盖 prefers-color-scheme
  theme: loadJSON('tripTheme', 'auto'),
})

export const TABS = [
  { id: 'pick', label: '选城' },
  { id: 'reserve', label: '预约景点' },
  { id: 'plan', label: '行程' },
  { id: 'eats', label: '便宜美食' },
  { id: 'memo', label: '出行备忘' },
]

export const cityById = (id) => CITIES.find(c => c.id === id) || null
export const nm = (id) => { const c = cityById(id); return c ? c.name : id }
export const star = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)
export const rtTxt = (id) => { const m = RT[id]; return m === 0 ? '在家门口' : '往返约 ' + (Math.round(m / 6) / 10) + ' 小时' }
export const foodYuan = (f) => f.yuan || 99
export const reservationsFor = (cityId) => RESERVATIONS.filter(r => r.city === cityId)
export const reservationById = (id) => RESERVATIONS.find(r => r.id === id) || null
export const holById = (id) => HOLIDAYS.find(h => h.id === id) || null
export const isRes = (id) => state.reservationPicked.includes(id)

export function cheapFoods(c, n) {
  const arr = (c.foods || []).slice().sort((a, b) => foodYuan(a) - foodYuan(b))
  return arr.filter(f => f.cheap).slice(0, n || 3)
}

export function dateAt(i) {
  const d = new Date(state.tripStart + 'T00:00:00')
  d.setDate(d.getDate() + i)
  return { d: (d.getMonth() + 1) + '/' + d.getDate(), w: '周' + '日一二三四五六'.charAt(d.getDay()) }
}

export const xhs = (q) => 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(q)
export const dp = (q) => 'https://www.dianping.com/search/keyword/1/0_' + encodeURIComponent(q)
export const gd = (q) => 'https://ditu.amap.com/search?query=' + encodeURIComponent(q)

export const days = computed(() => state.mode === 'fill' ? state.fillDays : state.dayCount)

export function autoDayCount() {
  if (!state.dayAuto) return
  const k = state.picked.filter(id => id !== 'hz').length
  state.dayCount = Math.min(7, Math.max(1, k))
}

function nextTheme(used) {
  for (let i = 0; i < HZ_THEMES.length; i++) {
    if (used.indexOf(HZ_THEMES[i].id) < 0) { used.push(HZ_THEMES[i].id); return { type: 'theme', theme: HZ_THEMES[i] } }
  }
  return { type: 'theme', theme: HZ_THEMES[HZ_THEMES.length - 1] }
}

function expandCities(ids, need) {
  const out = []
  for (let i = 0; i < ids.length; i++) out.push({ type: 'city', id: ids[i], pass: 1 })
  if (!ids.length) return out
  let extra = need - out.length
  let k = 0
  while (extra > 0 && k < ids.length) {
    out.splice(k * 2 + 1, 0, { type: 'city', id: ids[k], pass: 2 })
    extra--; k++
  }
  return out
}

export function buildPlan() {
  const fill = state.mode === 'fill'
  const n = fill ? state.fillDays : state.dayCount
  const pool = state.picked.filter(id => id !== 'hz')
  const peak = state.peakHz && n >= 2 && (fill || n - 2 >= pool.length)
  const ordered = pool.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const used = []
  const inner = peak ? n - 2 : n
  let leftover = []
  let mid = expandCities(ordered, inner)
  if (mid.length > inner) { leftover = mid.slice(inner).map(s => s.id); mid = mid.slice(0, inner) }
  while (mid.length < inner) mid.push(nextTheme(used))
  let slots
  if (peak) {
    slots = [nextTheme(used), ...mid, nextTheme(used)]
  } else {
    slots = mid
  }
  return { n, slots, leftover, peak }
}

export function regen() {
  if (state.planSlots.length) {
    const r = buildPlan()
    state.planSlots = r.slots
    state.leftover = r.leftover
  }
}

export function genPlan() {
  const r = buildPlan()
  state.planSlots = r.slots
  state.leftover = r.leftover
}

export function slotTitle(s) {
  if (s.type === 'theme') return s.theme.emoji + ' ' + s.theme.name
  const c = cityById(s.id)
  return c.emoji + ' ' + c.name + (s.pass === 2 ? ' · 慢游补一天' : '')
}

export function slotBody(s) {
  if (s.type === 'theme') {
    const t = s.theme
    return { am: t.am, pm: t.pm, eve: t.eve, foods: t.foods, booking: t.booking, tl: t.tl, time: '在家门口', price: '¥0' }
  }
  const c = cityById(s.id)
  const foods = cheapFoods(c, 3).map(f => f.n + '（' + f.price + '）')
  if (s.pass === 2) {
    return {
      am: '专吃：' + foods.join('、'),
      pm: c.spots.slice(2, 4).map(x => x[0]).join('、') || '未去过的冷门点',
      eve: '早一点回杭，别把末班高铁卡死。',
      tl: [
        ['09:30', '睡到自然醒，地铁出发'],
        ['11:00', '糕团店早午饭合并（慢慢排队买）约1.5小时'],
        ['13:00', '冷门景点慢逛 约2.5小时'],
        ['16:00', '街巷咖啡 / 甜品 约1.5小时'],
        ['18:00', '晚饭 约1.5小时'],
        ['20:00', '返程高铁（别卡末班）']
      ],
      foods, booking: c.booking, time: c.time, price: c.price
    }
  }
  return { am: c.am, pm: c.pm, eve: c.eve, foods, booking: c.booking, tl: c.tl, time: c.time, price: c.price }
}

export function budgetCalc() {
  let fare = 0, ticket = 0
  for (const s of state.planSlots) {
    if (s.type === 'city') {
      fare += (FARE[s.id] || 0) * 2
      const t = TICKET[s.id] || [0, 0]
      ticket += state.stu ? t[1] : t[0]
    } else {
      const tt = s.theme.ticket || [0, 0]
      ticket += state.stu ? tt[1] : tt[0]
    }
  }
  const d = state.planSlots.length
  return { fare, ticket, days: d, foodLo: 40 * d, foodHi: 80 * d, trLo: 10 * d, trHi: 20 * d }
}

// 按行程日（slot）拆分花费：高铁/门票/吃饭(中值)/市内(中值)
// 用于"按城市"饼图与表格细化
export function budgetBySlot() {
  const slots = state.planSlots
  const foodMid = 60 // (40+80)/2
  const trMid = 15 // (10+20)/2
  return slots.map((s, i) => {
    let fare = 0, ticket = 0
    let key, name, emoji
    if (s.type === 'city') {
      fare = (FARE[s.id] || 0) * 2
      const t = TICKET[s.id] || [0, 0]
      ticket = state.stu ? t[1] : t[0]
      const c = cityById(s.id)
      key = 'city-' + s.id + (s.pass === 2 ? '-p2' : '')
      name = (c ? c.name : s.id) + (s.pass === 2 ? '·补一天' : '')
      emoji = c ? c.emoji : '📍'
    } else {
      const tt = s.theme.ticket || [0, 0]
      ticket = state.stu ? tt[1] : tt[0]
      key = 'theme-' + s.theme.id + '-' + i
      name = '杭州·' + s.theme.name.replace(/^杭州\s*[·]?/, '')
      emoji = s.theme.emoji || '🏡'
    }
    const food = foodMid
    const tr = s.type === 'city' ? trMid : trMid * 0.6 // 杭州本地交通略低
    return { idx: i, key, name, emoji, fare, ticket, food, tr, total: fare + ticket + food + tr }
  })
}

const savePicked = () => saveJSON('tripPicked', state.picked)
const saveRes = () => saveJSON('reservationPicked', state.reservationPicked)
const saveState = () => saveJSON('tripState', { start: state.tripStart, fillDays: state.fillDays, hol: state.curHol, stu: state.stu })

function effectiveTheme(v) {
  if (v === 'dark' || v === 'light') return v
  // auto：跟随系统
  try {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch (e) {}
  return 'light'
}

export function applyTheme() {
  try {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', effectiveTheme(state.theme))
  } catch (e) {}
}

export function setTheme(v) {
  state.theme = v === 'dark' || v === 'light' ? v : 'auto'
  saveJSON('tripTheme', state.theme)
  applyTheme()
}

// 系统主题切换时，如果是 auto 模式要跟随更新
if (typeof window !== 'undefined' && window.matchMedia) {
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.theme === 'auto') applyTheme() })
  } catch (e) {}
}

export function toggleCity(id) {
  const i = state.picked.indexOf(id)
  if (i >= 0) {
    state.picked.splice(i, 1)
    state.reservationPicked = state.reservationPicked.filter(rid => { const r = reservationById(rid); return r && r.city !== id })
    saveRes()
  } else {
    state.picked.push(id)
  }
  savePicked(); autoDayCount(); regen()
}

export function toggleReservation(id) {
  const r = reservationById(id)
  if (!r) return
  const i = state.reservationPicked.indexOf(id)
  if (i >= 0) {
    state.reservationPicked.splice(i, 1)
  } else {
    state.reservationPicked.push(id)
    if (!state.picked.includes(r.city)) { state.picked.push(r.city); savePicked(); autoDayCount() }
  }
  saveRes(); regen()
  state.showReserveRoute = false
  state.reserveDirty = true
}

export function setHoliday(id) {
  const h = holById(id)
  if (!h) return
  state.curHol = h.id; state.tripStart = h.start; state.fillDays = h.days; state.mode = 'fill'
  saveState(); regen()
}

export function setStartDate(v) {
  if (!v) return
  state.tripStart = v; state.curHol = 'diy'
  saveState(); regen()
}

export function setMode(v) { state.mode = v; regen() }

export function setDays(n) {
  if (state.mode === 'fill') state.fillDays = n
  else { state.dayCount = n; state.dayAuto = false }
  saveState(); regen()
}

export function setStu(v) { state.stu = v; saveState(); regen() }
export function setPeak(v) { state.peakHz = v; regen() }

export function moveSlot(from, to) {
  if (from === to) return
  if (from < 0 || from >= state.planSlots.length) return
  to = Math.max(0, Math.min(state.planSlots.length - 1, to))
  const item = state.planSlots.splice(from, 1)[0]
  state.planSlots.splice(to, 0, item)
}

export function clearAll() {
  state.picked = []; state.reservationPicked = []; state.planSlots = []; state.leftover = []
  state.showReserveRoute = false; state.reserveDirty = false
  savePicked(); saveRes(); autoDayCount()
}

export function selectAll() {
  state.picked = CITIES.map(c => c.id)
  savePicked(); autoDayCount(); regen()
}

export function setTab(id) {
  if (!TABS.some(t => t.id === id)) id = 'pick'
  state.activeTab = id
  try { if (history.replaceState) history.replaceState(null, '', '#' + id) } catch (e) {}
}

export function scrollToTab() {
  const tb = document.querySelector('nav.toc')
  window.scrollTo({ top: tb ? tb.offsetTop : 0, behavior: 'smooth' })
}

export const dateChip = computed(() => {
  const h = holById(state.curHol)
  const label = h ? h.name + ' ' : ''
  const a = dateAt(0), b = dateAt(days.value - 1)
  return label + a.d + ' — ' + b.d
})

export const holidayChips = computed(() => HOLIDAYS.map(h => {
  const d = new Date(h.start + 'T00:00:00')
  return { id: h.id, label: h.name + ' ' + (d.getMonth() + 1) + '/' + d.getDate() + (h.tip ? '（预）' : '') }
}))

export const saleRows = computed(() => {
  const n = days.value
  const rows = []
  for (let i = 0; i < n; i++) {
    const t = new Date(state.tripStart + 'T00:00:00')
    t.setDate(t.getDate() + i)
    const s = new Date(t.getTime() - 14 * 86400000)
    rows.push({
      ride: (t.getMonth() + 1) + '/' + t.getDate() + ' 周' + '日一二三四五六'.charAt(t.getDay()),
      sale: (s.getMonth() + 1) + '/' + s.getDate(),
      note: i === 0 ? '出发日，全国抢票高峰' : (i === n - 1 ? '返程高峰，开售立刻买并开候补' : '')
    })
  }
  return rows
})

export const summaryTxt = computed(() => {
  if (!state.picked.length) return ''
  let tot = 0, nonhz = 0
  for (const id of state.picked) { tot += RT[id] || 0; if (id !== 'hz') nonhz++ }
  let s = '已选 ' + state.picked.length + ' 座 · 外地 ' + nonhz + ' 座'
  if (nonhz) s += ' · 平均往返约 ' + (Math.round((tot / nonhz) / 6) / 10) + ' 小时'
  return s
})

export const filteredCities = computed(() => CITIES.filter(c => {
  if (state.cityFilter === 'easy') return RT[c.id] <= 100
  if (state.cityFilter === 'cheap') return (FARE[c.id] || 0) <= 100
  if (state.cityFilter === 'star') return c.stars >= 4
  return true
}))

export const eatItems = computed(() => {
  const items = []
  for (const c of CITIES) {
    if (state.foodFilter === 'picked' && !state.picked.includes(c.id)) continue
    for (const f of c.foods) {
      if (state.foodFilter === 'cheap' && (!f.cheap || foodYuan(f) > 20)) continue
      items.push({ c, f })
    }
  }
  return items.sort((a, b) => foodYuan(a.f) - foodYuan(b.f))
})

export const budget = computed(() => budgetCalc())

// 按行程日拆分（饼图用）
export const budgetSlots = computed(() => budgetBySlot())

// 按类别拆分饼图数据（取中值作为代表值）
export const budgetByCategory = computed(() => {
  const b = budget.value
  const foodMid = Math.round((b.foodLo + b.foodHi) / 2)
  const trMid = Math.round((b.trLo + b.trHi) / 2)
  return [
    { name: '高铁往返', value: b.fare, color: '#c8542f' },
    { name: '景点门票', value: b.ticket, color: '#2f6f5e' },
    { name: '吃饭', value: foodMid, color: '#b8860b' },
    { name: '市内交通', value: trMid, color: '#3d6a8f' },
  ].filter(x => x.value > 0)
})

// 按城市聚合（同一城市多日合并）
export const budgetByCity = computed(() => {
  const map = new Map()
  for (const s of budgetBySlot()) {
    const key = s.name.replace(/·补一天$/, '')
    const cur = map.get(key) || { name: key, emoji: s.emoji, fare: 0, ticket: 0, food: 0, tr: 0, total: 0 }
    cur.fare += s.fare; cur.ticket += s.ticket; cur.food += s.food; cur.tr += s.tr; cur.total += s.total
    map.set(key, cur)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

// 仪表盘 KPI
export const dashboard = computed(() => {
  const b = budget.value
  const totalLo = b.fare + b.ticket + b.foodLo + b.trLo
  const totalHi = b.fare + b.ticket + b.foodHi + b.trHi
  const totalMid = Math.round((totalLo + totalHi) / 2)
  const nonHz = state.picked.filter(id => id !== 'hz').length
  const avgPerDay = b.days > 0 ? Math.round(totalMid / b.days) : 0
  const cityCount = state.picked.length
  const reservedCount = state.reservationPicked.length
  return {
    days: b.days,
    cityCount,
    nonHzCount: nonHz,
    fare: b.fare,
    ticket: b.ticket,
    foodLo: b.foodLo,
    foodHi: b.foodHi,
    trLo: b.trLo,
    trHi: b.trHi,
    totalLo,
    totalHi,
    totalMid,
    avgPerDay,
    reservedCount,
    leftoverCount: state.leftover.length,
  }
})

export const leftoverNames = computed(() => {
  const names = [], seen = {}
  for (const id of state.leftover) if (!seen[id]) { seen[id] = 1; names.push(nm(id)) }
  return names
})

export const mapSelected = computed(() => state.picked.filter(id => MAP_POINTS[id]))

export const mapRouteD = computed(() => {
  const sel = mapSelected.value
  if (!sel.length) return ''
  const ids = ['hz']
  for (const id of sel) if (!ids.includes(id)) ids.push(id)
  if (ids[ids.length - 1] !== 'hz') ids.push('hz')
  let d = ''
  for (const id of ids) { const p = MAP_POINTS[id]; if (p) d += (d ? ' L' : 'M') + p.x + ' ' + p.y }
  return d
})

export const reserveGroups = computed(() => {
  const ids = []
  for (const id of state.picked) if (reservationsFor(id).length && !ids.includes(id)) ids.push(id)
  for (const r of RESERVATIONS) if (!ids.includes(r.city)) ids.push(r.city)
  return ids.map(id => ({ city: cityById(id), list: reservationsFor(id) })).filter(g => g.city && g.list.length)
})

export const reserveRouteGroups = computed(() => {
  const sel = RESERVATIONS.filter(r => state.reservationPicked.includes(r.id))
  if (!sel.length) return []
  const ids = []
  for (const id of state.picked) if (sel.some(r => r.city === id) && !ids.includes(id)) ids.push(id)
  for (const r of sel) if (!ids.includes(r.city)) ids.push(r.city)
  return ids.map(id => ({ city: cityById(id), list: sel.filter(r => r.city === id) })).filter(g => g.city && g.list.length)
})

export function planText() {
  let out = '假期行程 · 余杭出发当天往返\n'
  if (!state.planSlots.length) out += '还没生成行程。\n'
  for (let i = 0; i < state.planSlots.length; i++) {
    const date = dateAt(i), s = state.planSlots[i], b = slotBody(s)
    out += '\n' + date.d + ' ' + date.w + '  ' + slotTitle(s) + '\n'
    out += '  车程 ' + b.time + ' · 约 ' + b.price + '\n'
    if (b.tl) {
      for (const t of b.tl) out += '  ' + t[0] + '  ' + t[1] + '\n'
    } else {
      out += '  上午 ' + b.am + '\n  下午 ' + b.pm + '\n  傍晚 ' + b.eve + '\n'
    }
    out += '  吃 ' + (b.foods || []).join('、') + '\n'
  }
  if (state.planSlots.length) {
    const bc = budgetCalc()
    out += '\n预算粗算：高铁 ¥' + bc.fare + ' · 门票 ¥' + bc.ticket + ' · 吃饭 ¥' + bc.foodLo + '—' + bc.foodHi + ' · 市内 ¥' + bc.trLo + '—' + bc.trHi
    out += '\n合计约 ¥' + (bc.fare + bc.ticket + bc.foodLo + bc.trLo) + '—' + (bc.fare + bc.ticket + bc.foodHi + bc.trHi) + '\n'
  }
  if (state.reservationPicked.length) {
    out += '\n预约景点路线：\n'
    for (const g of reserveRouteGroups.value) {
      out += '  ' + g.city.name + '：杭州出发 → ' + g.list.map(r => r.name).join(' → ') + ' → 回杭州\n'
      for (const r of g.list) out += '    ' + r.name + '：' + r.window + '，' + r.duration + '\n'
    }
  }
  return out
}

autoDayCount()
