/* ============================================================
 * 分享 / 日历 / 复制工具（无依赖、纯前端）
 * - .ics 按 RFC 5545 生成（转义 + 75 字节折行）
 * - 分享链接把 state 编码到 ?p= / ?s= / ?d= / ?m= / ?stu= / ?peak= / ?res=
 * - copyText 兼容老浏览器
 * ============================================================ */

import { cityById, nm, slotBody, slotTitle, cheapFoods, dateAt } from './store.js'
import { FARE } from './data.js'

// ---- RFC 5545 ----
function pad(n) { return n < 10 ? '0' + n : '' + n }

// 把 Date 转成 .ics 本地时间戳（不带 Z，按用户当前 TZ 解释）
function icsDate(d) {
  return d.getFullYear()
    + pad(d.getMonth() + 1) + pad(d.getDate())
    + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
}

// 转义 RFC 5545 文本里的特殊字符
function icsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

// 75 字节折行（UTF-8 安全：按字节截，汉字退避半个字节不会断字符）
function foldLine(line) {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  let out = '', start = 0, first = true
  while (start < bytes.length) {
    let end = Math.min(start + (first ? 75 : 74), bytes.length)
    // 防止把多字节字符截断：往回退到完整字符边界
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--
    const slice = bytes.slice(start, end)
    out += (first ? '' : '\r\n ') + new TextDecoder().decode(slice)
    start = end; first = false
  }
  return out
}

function icsLine(k, v) { return foldLine(k + ':' + icsEscape(v)) }

function icsStamp() {
  return icsDate(new Date())
}

// ---- 行程事件 ----
export function buildPlanIcs(slots, tripStart) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//guoqing-travel//plan//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEscape('假期行程 · 余杭出发'),
  ]
  const now = new Date()
  const stamp = icsStamp()
  slots.forEach((s, i) => {
    const { d, w } = dateAt(i)
    const day = new Date(tripStart + 'T00:00:00')
    day.setDate(day.getDate() + i)
    const b = slotBody(s)
    // 开始时间 = tl 第一项（如 "08:30" 或 "06:30" / "自然醒"），找不到就 09:00
    let sh = 9, sm = 0
    if (b.tl && b.tl.length) {
      const m = /^(\d{1,2}):(\d{2})/.exec(b.tl[0][0])
      if (m) { sh = +m[1]; sm = +m[2] }
    }
    const start = new Date(day); start.setHours(sh, sm, 0, 0)
    // 结束时间 = tl 最后一项时间 +1 小时；找不到就 21:00
    let eh = 21, em = 0
    if (b.tl && b.tl.length) {
      const last = b.tl[b.tl.length - 1][0]
      const m = /^(\d{1,2}):(\d{2})/.exec(last)
      if (m) { eh = Math.min(23, +m[1] + 1); em = +m[2] }
    }
    const end = new Date(day); end.setHours(eh, em, 0, 0)

    const title = slotTitle(s).replace(/^(\S+)\s+/, '$1 ')
    const lines2 = []
    if (b.tl && b.tl.length) {
      for (const t of b.tl) lines2.push(t[0] + ' ' + t[1])
    } else {
      lines2.push('上午 ' + b.am)
      lines2.push('下午 ' + b.pm)
      lines2.push('傍晚 ' + b.eve)
    }
    if (b.foods && b.foods.length) lines2.push('吃：' + b.foods.join('、'))
    if (b.booking) lines2.push('预约：' + b.booking)
    lines2.push('车程 ' + b.time + ' · 约 ' + b.price)

    lines.push(
      'BEGIN:VEVENT',
      'UID:plan-' + tripStart + '-' + i + '@guoqing-travel',
      'DTSTAMP:' + stamp,
      'DTSTART:' + icsDate(start),
      'DTEND:' + icsDate(end),
      'SUMMARY:' + icsEscape(title),
      'LOCATION:' + icsEscape(s.type === 'theme' ? '杭州' : (cityById(s.id) ? cityById(s.id).name : '')),
      'DESCRIPTION:' + icsEscape(lines2.join('\n')),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape('行程提醒：' + title),
      'TRIGGER:-PT1H',
      'END:VALARM',
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// ---- 抢票开售事件 ----
export function buildSaleIcs(tripStart, days) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//guoqing-travel//sale//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEscape('12306 开售提醒'),
  ]
  const stamp = icsStamp()
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const t = new Date(tripStart + 'T00:00:00')
    t.setDate(t.getDate() + i)
    const s = new Date(t.getTime() - 14 * 86400000)
    if (s.getTime() < now.getTime() - 86400000) continue // 过期跳过
    s.setHours(8, 30, 0, 0) // 12306 早 8:30 开售
    const note = i === 0 ? '出发日，全国抢票高峰'
      : (i === days - 1 ? '返程高峰，开售立刻买并开候补' : '去程/返程车票可抢')
    lines.push(
      'BEGIN:VEVENT',
      'UID:sale-' + tripStart + '-' + i + '@guoqing-travel',
      'DTSTAMP:' + stamp,
      'DTSTART:' + icsDate(s),
      'DTEND:' + icsDate(new Date(s.getTime() + 30 * 60000)),
      'SUMMARY:' + icsEscape('12306 开售 · ' + (t.getMonth() + 1) + '/' + t.getDate() + ' 的车票'),
      'DESCRIPTION:' + icsEscape(note + '。可在 12306 提前定好常用车次/时段提醒。'),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape('今日 8:30 开售，记得抢票'),
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// ---- 下载 ----
export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---- 复制 ----
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus(); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch (e) { return false }
}

// ---- 分享链接（state ↔ URL）----
export function encodeShare(state) {
  const p = new URLSearchParams()
  if (state.picked && state.picked.length) p.set('p', state.picked.join(','))
  if (state.reservationPicked && state.reservationPicked.length) p.set('res', state.reservationPicked.join(','))
  if (state.tripStart) p.set('s', state.tripStart)
  if (state.mode === 'fix') p.set('m', 'fix')
  if (state.mode === 'fix') p.set('d', String(state.dayCount))
  else if (state.fillDays !== 7) p.set('d', String(state.fillDays))
  if (!state.stu) p.set('stu', '0')
  if (!state.peakHz) p.set('peak', '0')
  return p.toString()
}

export function decodeShare(search) {
  const out = {}
  if (!search) return out
  const usp = search.startsWith('?') ? search.slice(1) : search
  const p = new URLSearchParams(usp)
  if (p.has('p')) out.picked = p.get('p').split(',').filter(Boolean)
  if (p.has('res')) out.reservationPicked = p.get('res').split(',').filter(Boolean)
  if (p.has('s')) out.tripStart = p.get('s')
  if (p.has('m')) out.mode = p.get('m')
  if (p.has('d')) {
    const n = parseInt(p.get('d'), 10)
    if (!Number.isNaN(n)) {
      if (out.mode === 'fix') out.dayCount = n
      else out.fillDays = n
    }
  }
  if (p.has('stu')) out.stu = p.get('stu') !== '0'
  if (p.has('peak')) out.peakHz = p.get('peak') !== '0'
  return out
}

// 把状态应用到 store（不重置已有；只覆盖分享参数里有的字段）
export function applyShare(state, decoded) {
  if (decoded.picked) state.picked = decoded.picked.slice()
  if (decoded.reservationPicked) state.reservationPicked = decoded.reservationPicked.slice()
  if (decoded.tripStart) state.tripStart = decoded.tripStart
  if (decoded.mode === 'fix' || decoded.mode === 'fill') state.mode = decoded.mode
  if (typeof decoded.fillDays === 'number') state.fillDays = decoded.fillDays
  if (typeof decoded.dayCount === 'number') {
    state.dayCount = decoded.dayCount; state.dayAuto = false
  }
  if (typeof decoded.stu === 'boolean') state.stu = decoded.stu
  if (typeof decoded.peakHz === 'boolean') state.peakHz = decoded.peakHz
}

// ---- 开售倒计时（用于桌面通知 / 倒计时卡片）----
export function saleCountdown(tripStart, days) {
  const now = Date.now()
  let best = null
  for (let i = 0; i < days; i++) {
    const t = new Date(tripStart + 'T00:00:00')
    t.setDate(t.getDate() + i)
    const s = new Date(t.getTime() - 14 * 86400000)
    s.setHours(8, 30, 0, 0)
    const diff = s.getTime() - now
    if (diff <= 0) continue // 已过期
    if (!best || diff < best.diff) {
      best = {
        diff,
        saleAt: s,
        rideAt: t,
        rideLabel: (t.getMonth() + 1) + '/' + t.getDate() + ' 周' + '日一二三四五六'.charAt(t.getDay()),
        note: i === 0 ? '出发日' : (i === days - 1 ? '返程' : '去程'),
      }
    }
  }
  return best
}

export function formatCountdown(diff) {
  if (diff <= 0) return '已开售'
  const sec = Math.floor(diff / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return d + ' 天 ' + pad(h) + ':' + pad(m) + ':' + pad(s)
}