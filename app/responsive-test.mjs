// 响应式优化单元测试 — 沿用 smoke-test.mjs 的纯 Node.js 风格，不引入测试框架
// 覆盖：theme.css 媒体查询 / token / 暗色模式 / 打印样式，PlanPanel 双栏结构，BudgetChart 延迟渲染
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(join(__dirname, p), 'utf8')

let pass = 0, fail = 0
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg) }
  else { fail++; console.log('  FAIL ' + msg) }
}
function includes(hay, needle, msg) { ok(hay.includes(needle), msg + '  (missing: ' + JSON.stringify(needle) + ')') }

const theme = read('src/theme.css')
const planPanel = read('src/components/PlanPanel.vue')
const budgetChart = read('src/components/BudgetChart.vue')
const cityPicker = read('src/components/CityPicker.vue')

console.log('--- 1. 间距 / 圆角 token ---')
includes(theme, '--sp-1:4px', 'sp-1 token')
includes(theme, '--sp-8:40px', 'sp-8 token')
includes(theme, '--r-sm:6px', 'r-sm token')
includes(theme, '--r-pill:999px', 'r-pill token')
ok(/--sp-[1-8]:/.test(theme) && /--sp-[1-8]:/.test(theme), 'sp token 完整序列')

console.log('--- 2. 断点 560 / 640 / 768 / 1024 / 1280 ---')
includes(theme, '@media (max-width:560px)', '560 断点')
includes(theme, '@media (max-width:640px)', '640 断点')
includes(theme, '@media (max-width:760px)', '760 断点')
includes(theme, '@media (min-width:768px)', '768 断点')
includes(theme, '@media (min-width:1024px)', '1024 断点')
includes(theme, '@media (min-width:1280px)', '1280 断点')

console.log('--- 3. PlanPanel 双栏布局（plan-grid + plan-aside + plan-main）---')
includes(planPanel, 'class="plan-grid"', '模板含 plan-grid 容器')
includes(planPanel, 'class="plan-aside"', '模板含 plan-aside 副栏')
includes(planPanel, 'class="plan-main"', '模板含 plan-main 主栏')
includes(theme, '.plan-grid{display:block}', 'plan-grid 默认单栏')
includes(theme, 'grid-template-areas:"main aside"', 'plan-grid 桌面双栏 grid-template-areas')
includes(theme, '.plan-aside{grid-area:aside', 'plan-aside grid-area 命名')
includes(theme, 'position:sticky', 'plan-aside sticky 定位')
includes(theme, 'top:80px', 'plan-aside sticky top:80px')
includes(theme, 'max-height:calc(100vh - 100px)', 'plan-aside max-height')

console.log('--- 4. 移动端 TOC 横滚 + 触控目标 ---')
includes(theme, 'nav.toc{flex-wrap:nowrap;overflow-x:auto', 'TOC 移动端横滚')
includes(theme, 'scroll-snap-type:x mandatory', 'TOC scroll-snap')
includes(theme, 'scroll-snap-align:start', 'TOC snap-align start')
includes(theme, '.mv button{width:40px;height:40px', 'mv 触控目标 40px')
includes(theme, '.check{width:40px;height:40px', 'check 触控目标 40px')
includes(theme, '.seg,.opt{min-height:40px', 'seg/opt min-height 40px')

console.log('--- 5. 桌面 CityCard 双列网格 ---')
includes(cityPicker, 'class="city-picker"', 'CityPicker 含 city-picker 容器')
includes(theme, '.city-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))', 'city-picker 桌面双列')
includes(theme, 'grid-column:1 / -1', '搜索栏/工具栏跨满列')

console.log('--- 6. 暗色模式 ---')
includes(theme, '@media (prefers-color-scheme:dark)', 'prefers-color-scheme:dark 媒体查询')
includes(theme, '--bg:#1a1612;--card:#241f19', '暗色 token 覆盖')
includes(theme, '--brand:#e08a3c;--brand2:#5fa888', '暗色品牌色')
includes(theme, 'background-color:#15120e', '暗色 body 背景')

console.log('--- 7. 打印样式 ---')
includes(theme, '@media print{', '@media print 块')
includes(theme, 'nav.toc,.search-box,.actions,.filters,.controls,.c-head,.mv,.van-back-top{display:none', '打印隐藏交互元素')
includes(theme, '.plan-grid{display:block !important}', '打印时 plan-grid 降级单栏')
includes(theme, '.plan-aside{position:static', '打印时 plan-aside 取消 sticky')

console.log('--- 8. 大屏容器加宽 ---')
includes(theme, '.wrap{max-width:1040px', '默认容器 1040px')
includes(theme, '@media (min-width:1280px){\n  .wrap{max-width:1120px}', '1280+ 容器加宽 1120px')

console.log('--- 9. BudgetChart 延迟渲染（chartReady）---')
includes(budgetChart, 'v-chart v-if="chartReady"', 'v-chart 受 chartReady 控制')
includes(budgetChart, 'bdg-chart--placeholder', '占位 div 保留高度')
includes(budgetChart, 'const chartReady = ref(false)', 'chartReady ref(false) 初始')
includes(budgetChart, 'if (v === \'plan\') {\n    if (!chartReady.value) chartReady.value = true', '进入 plan tab 才置 ready')
includes(budgetChart, 'watch(() => state.activeTab', 'watch activeTab')
includes(budgetChart, 'if (inst && typeof inst.resize === \'function\') inst.resize()', 'resizeChart 逻辑')
includes(theme, '.bdg-chart--placeholder{', 'placeholder 样式')

console.log('--- 10. 响应式断点对 CityCard/图表的协调 ---')
includes(theme, '@media (max-width:640px){\n  .dash{padding:16px 14px}', '640- 仪表盘收窄')
includes(theme, '.kpi-grid{grid-template-columns:repeat(2,1fr)', '640- KPI 两列')
includes(theme, '.bdg-body{grid-template-columns:1fr}', '640- 图表区单列')
includes(theme, '.bdg-chart{height:220px}', '640- 图表高度 220px')

console.log('')
console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
