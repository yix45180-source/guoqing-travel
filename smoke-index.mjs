/* 单文件版 index.html 冒烟测试（jsdom）
 * 运行：node --experimental-vm-modules smoke-index.mjs  （需 NODE_PATH 指向 jsdom）
 * 覆盖：页面加载无报错 / 生成行程 / 开售倒计时 / .ics 导出 / 分享链接 / 深色模式 / URL 还原
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let JSDOM, VirtualConsole
try { ({ JSDOM, VirtualConsole } = require('jsdom')) }
catch (e) { ({ JSDOM, VirtualConsole } = require('C:/Users/一笑/.workbuddy/binaries/node/workspace/node_modules/jsdom')) }
import { readFileSync, createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(here, 'index.html')

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg' }
const server = http.createServer((req, res) => {
  const p = path.join(here, decodeURIComponent(req.url.split('?')[0].split('#')[0]))
  try {
    const stat = require('node:fs').statSync(p)
    if (stat.isDirectory()) throw new Error('dir')
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' })
    createReadStream(p).pipe(res)
  } catch (e) { res.writeHead(404); res.end('404') }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = 'http://127.0.0.1:' + server.address().port
let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m) } else { fail++; console.log('  FAIL ' + m) } }

function boot(url) {
  const errors = []
  const dom = new JSDOM(readFileSync(file, 'utf8'), {
    url: url || base + '/index.html',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole().on('jsdomError', e => errors.push(e.message)).on('error', e => errors.push(String(e)))
  })
  return new Promise(res => {
    dom.window.addEventListener('load', () => setTimeout(() => res({ dom, win: dom.window, doc: dom.window.document, errors }), 60))
    setTimeout(() => res({ dom, win: dom.window, doc: dom.window.document, errors }), 2500)
  })
}

console.log('--- 1. 页面加载 ---')
const { dom, win, doc, errors } = await boot()
const real = errors.filter(e => !/Not implemented|Could not load img|stylesheet/i.test(e))
ok(real.length === 0, '加载无 JS 报错' + (real.length ? '：' + real[0] : ''))
ok(!!doc.getElementById('btnIcs'), '新增按钮已渲染（导出 .ics）')
ok(!!doc.getElementById('btnTheme'), '主题切换按钮已渲染')
ok(!!doc.getElementById('saleCount'), '倒计时容器已渲染')

console.log('--- 2. 选城 + 生成行程 ---')
doc.getElementById('btnAll').click()
ok(doc.querySelectorAll('#selList .sel-pill').length > 0, '全选后有已选城市标签')
doc.getElementById('btnPlan').click()
const days = doc.querySelectorAll('#timeline .day')
ok(days.length > 0, '生成行程时间轴（' + days.length + ' 天）')
ok(doc.getElementById('budget').innerHTML.includes('合计'), '预算表已渲染')

console.log('--- 3. 开售倒计时 ---')
const count = doc.getElementById('saleCount').textContent
ok(/后开售|都已开售/.test(count), '倒计时卡片有内容：' + count.slice(0, 46).replace(/\s+/g, ' '))
await new Promise(r => setTimeout(r, 1100))
ok(doc.getElementById('saleCount').textContent !== count, '倒计时每秒刷新')

console.log('--- 4. 导出 .ics ---')
let icsText = null
win.URL.createObjectURL = (blob) => { blob.text().then(t => { icsText = t }); return 'blob:fake' }
win.URL.revokeObjectURL = () => {}
doc.getElementById('btnIcs').click()
await new Promise(r => setTimeout(r, 120))
ok(!!icsText, '生成了 .ics 文件')
if (icsText) {
  ok(icsText.startsWith('BEGIN:VCALENDAR') && icsText.trim().endsWith('END:VCALENDAR'), 'VCALENDAR 结构完整')
  const events = icsText.split('BEGIN:VEVENT').length - 1
  const sales = (icsText.match(/SUMMARY:12306/g) || []).length
  ok(events === days.length + sales, 'VEVENT 数量 = 行程天数 + 抢票提醒（' + days.length + '+' + sales + '）')
  ok(/\r\n /.test(icsText), '长行已按 RFC5545 折叠')
  ok(/DTSTART:\d{8}T\d{6}/.test(icsText), '带时间的事件使用本地时间')
  ok(/BEGIN:VALARM/.test(icsText), '带提醒闹钟')
  ok(!/[^;]DTSTART;VALUE=DATE:\d{8}\r\n DTEND/.test(icsText), '全天事件格式正确')
}
doc.getElementById('btnIcsSale').click()
await new Promise(r => setTimeout(r, 120))
ok(!!icsText && /SUMMARY:12306/.test(icsText), '只导出抢票提醒可用')

console.log('--- 5. 分享链接 ---')
let copied = null
win.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve() } }
doc.getElementById('btnShare').click()
await new Promise(r => setTimeout(r, 60))
ok(!!copied && copied.includes('?p='), '分享链接含城市参数：' + (copied || '').slice(0, 90))
ok(!!copied && copied.includes('#plan'), '分享链接直达行程页')
ok(win.location.search.includes('p='), '地址栏同步了分享参数')

console.log('--- 6. 深色模式 ---')
const before = doc.documentElement.getAttribute('data-theme')
doc.getElementById('btnTheme').click()
const after = doc.documentElement.getAttribute('data-theme')
ok(before !== after, '主题切换生效：' + before + ' → ' + after)
ok(win.localStorage.getItem('tripTheme') === after, '主题已持久化')
ok(doc.getElementById('btnTheme').textContent.includes(after === 'dark' ? '浅色' : '深色'), '按钮文案随之变化')
doc.getElementById('btnTheme').click()
ok(doc.documentElement.getAttribute('data-theme') === before, '可切回原主题')

console.log('--- 7. 用分享链接还原 ---')
const shared = copied || win.location.href
const expectPills = doc.querySelectorAll('#selList .sel-pill').length
const expectStart = doc.getElementById('startDate').value
dom.window.close()
const s2 = await boot(shared)
const real2 = s2.errors.filter(e => !/Not implemented|Could not load img|stylesheet/i.test(e))
ok(real2.length === 0, '带参数加载无报错' + (real2.length ? '：' + real2[0] : ''))
ok(s2.doc.querySelectorAll('#selList .sel-pill').length === expectPills, '已选城市被还原（' + s2.doc.querySelectorAll('#selList .sel-pill').length + '/' + expectPills + '）')
ok(s2.doc.getElementById('startDate').value === expectStart, '出发日被还原：' + s2.doc.getElementById('startDate').value)
s2.dom.window.close()

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败')
server.close()
process.exit(fail ? 1 : 0)
