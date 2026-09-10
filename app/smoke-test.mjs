globalThis.localStorage = { getItem: () => null, setItem: () => {} }
const elStub = () => ({ innerHTML: '', content: { firstChild: null }, childNodes: [], setAttribute() {}, appendChild() {} })
globalThis.document = {
  querySelector: () => null,
  createElement: () => elStub(),
  createElementNS: () => elStub(),
  createTextNode: () => ({}),
  createComment: () => ({}),
  createDocumentFragment: () => elStub(),
}
globalThis.window = { scrollTo: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
globalThis.history = { replaceState: () => {} }

const { state, genPlan, buildPlan, budgetCalc, toggleCity, toggleReservation, setHoliday,
  setMode, setDays, setStu, setPeak, moveSlot, clearAll, selectAll, slotBody, slotTitle,
  planText, dateAt, days, budget, leftoverNames, summaryTxt, saleRows, holidayChips,
  mapRouteD, reserveGroups, reserveRouteGroups, TABS, nm } = await import('./src/store.js')
const { FARE, TICKET, CITIES, RESERVATIONS } = await import('./src/data.js')

let pass = 0, fail = 0
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg) }
  else { fail++; console.log('  FAIL ' + msg) }
}
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg + '  (got ' + JSON.stringify(a) + ')') }

console.log('--- 1. 初始状态 / 默认生成 ---')
eq(state.picked, [], 'picked 初始为空')
eq(state.mode, 'fill', '默认填满模式')
eq(state.fillDays, 7, '默认 7 天')
genPlan()
eq(state.planSlots.length, 7, '空选择时 7 个 slot')
ok(state.planSlots.every(s => s.type === 'theme'), '空选择时全部为杭州宅家主题')
ok(state.planSlots[0].type === 'theme' && state.planSlots[6].type === 'theme', 'peak 模式首尾为主题')

console.log('--- 2. 选城 + 填满模式（7天）---')
toggleCity('lh'); toggleCity('sh'); toggleCity('nx')
eq(state.picked.slice().sort(), ['lh','nx','sh'], '已选 3 城')
eq(state.dayCount, 3, 'dayCount 自动 = 3')
genPlan()
eq(state.planSlots.length, 7, '7 个 slot')
const ids1 = state.planSlots.map(s => s.type === 'city' ? s.id + (s.pass === 2 ? '*' : '') : 'T')
eq(ids1, ['T','nx','nx*','sh','sh*','lh','T'], 'ORDER 排序 nx→sh→lh，不足自动补 pass2')
ok(state.planSlots[0].type === 'theme' && state.planSlots[6].type === 'theme', '首尾杭州主题错峰')

console.log('--- 3. 预算计算 ---')
// slots = [west, nx, nx*, sh, sh*, lh, lz]：首尾主题，尾部轮到良渚 ticket [60,30]
let b = budgetCalc()
eq(b.fare, (59+59+87+87+118)*2, '高铁费 = 每次往返×出现次数')
eq(b.ticket, 48+48+0+0+28+30, '学生门票（含良渚主题30，sh/nj 免费）')
eq(b.days, 7, '天数 7')
setStu(false)
b = budgetCalc()
eq(b.ticket, 95+95+0+0+55+60, '成人门票切换（含良渚主题60）')
setStu(true)

console.log('--- 4. 指定天数模式 ---')
setMode('day')
eq(days.value, 3, 'day 模式天数 = dayCount(3)')
eq(state.planSlots.length, 3, '3 个 slot 无主题填充')
eq(state.planSlots.map(s => s.id), ['nx','sh','lh'], '纯城市')
setDays(5)
eq(state.planSlots.length, 5, '改 5 天')
ok(state.planSlots.filter(s => s.type === 'theme').length === 2, '不足补主题')
setMode('fill')

console.log('--- 5. 错峰开关 ---')
setPeak(false)
// fill 7 天、3 城：每城 pass1+pass2 共 6 slot，余 1 天补主题
eq(state.planSlots.filter(s => s.type === 'theme').length, 1, '关错峰后 6 城市 slot + 1 主题')
setPeak(true)

console.log('--- 6. 节假日切换 ---')
setHoliday('zq')
eq(state.tripStart, '2026-09-25', '中秋起始日')
eq(state.fillDays, 3, '中秋 3 天')
eq(state.planSlots.length, 3, '行程 3 slot')
setHoliday('gq')
eq(state.fillDays, 7, '回国庆 7 天')

console.log('--- 7. 日期计算 ---')
const d0 = dateAt(0)
const expectW = '周' + '日一二三四五六'.charAt(new Date('2026-10-01T00:00:00').getDay())
eq(d0.d, '10/1', '首日 10/1')
eq(d0.w, expectW, '星期计算与本地 Date 一致 (' + expectW + ')')
eq(saleRows.value.length, 7, '抢票表 7 行')
ok(/^\d+\/\d+$/.test(saleRows.value[0].sale), '开售日格式正确')
eq(holidayChips.value.length, 6, '6 个节假日 chip')

console.log('--- 8. 预约联动 ---')
const firstRes = RESERVATIONS[0]
toggleReservation(firstRes.id)
ok(state.reservationPicked.includes(firstRes.id), '预约已选')
ok(state.picked.includes(firstRes.city), '选预约自动带上城市: ' + nm(firstRes.city))
ok(reserveRouteGroups.value.length >= 1, '预约路线分组生成')
toggleReservation(firstRes.id)
ok(!state.reservationPicked.includes(firstRes.id), '取消预约')

console.log('--- 9. 拖拽重排 ---')
const before = state.planSlots.map(s => s.type === 'city' ? s.id : 'T')
moveSlot(0, 2)
const after = state.planSlots.map(s => s.type === 'city' ? s.id : 'T')
ok(before[0] === after[2] && before.length === after.length, 'moveSlot(0→2) 生效')

console.log('--- 10. slotBody / planText ---')
const body = slotBody(state.planSlots.find(s => s.type === 'city'))
ok(body && body.tl && body.tl.length >= 4, '城市 slot 含时间线')
const body2 = slotBody({ type: 'theme', theme: { am:'a', pm:'p', eve:'e', foods:['f'], booking:'', tl:[], ticket:[0,0] } })
eq(body2.time, '在家门口', '主题 slot 车程文案')
const txt = planText()
ok(txt.includes('假期行程'), 'planText 标题')
ok(txt.includes('预算粗算'), 'planText 含预算')
ok(txt.split('\n').length > 10, 'planText 内容完整')

console.log('--- 11. 全选 / 清空 ---')
selectAll()
eq(state.picked.length, CITIES.length, '全选 ' + CITIES.length + ' 城')
ok(leftoverNames.value.length >= 1, '超员城市进 leftover: ' + leftoverNames.value.join(','))
clearAll()
eq(state.picked, [], '清空')
eq(summaryTxt.value, '', '清空后摘要为空')
ok(mapRouteD.value === '', '清空后无路线')

console.log('--- 12. 其他 computed ---')
setDays(7)
toggleCity('nx'); toggleCity('sh')
ok(mapRouteD.value.startsWith('M'), 'SVG 路径生成')
ok(reserveGroups.value.length >= 1, '预约分组非空')
ok(summaryTxt.value.includes('已选 2 座'), '摘要文案')
ok(TABS.length === 5, '5 个 tab')

console.log('')
console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
