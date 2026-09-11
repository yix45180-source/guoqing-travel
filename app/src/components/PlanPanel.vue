<template>
  <section class="panel plan-panel">
    <h2>行程时间轴</h2>
    <p class="empty">选城后点「生成行程」。每张卡片是从出门到回家的完整时间表（含每个景点建议时长、高铁班次衔接）；卡片可拖拽或点 ↑↓ 调顺序。</p>
    <template v-if="state.planSlots.length">
      <div class="theme-card">
        <h3><van-icon :name="I.share" />分享与导出</h3>
        <p>把整套方案（已选城市、出发日、学生票、高峰留杭）发给别人，或导入手机日历。</p>
        <div class="actions">
          <van-button size="small" plain type="primary" :icon="I.calendar" @click="exportPlanIcs">导出行程 .ics</van-button>
          <van-button size="small" plain type="primary" :icon="I.warn" @click="exportSaleIcs">导出抢票提醒</van-button>
          <van-button size="small" plain type="primary" :icon="I.share" @click="copyShareLink">复制分享链接</van-button>
        </div>
      </div>
      <div class="plan-grid">
        <aside class="plan-aside">
          <PlanDashboard @copy="copyPlan" />
          <BudgetChart />
          <details class="bdg-detail" open>
            <summary>预算明细表（{{ budget.days }} 天）</summary>
            <table>
              <thead><tr><th>项目</th><th>估算</th><th>口径</th></tr></thead>
              <tbody>
                <tr><td>高铁往返</td><td>¥{{ budget.fare }}</td><td>二等座全价 × 往返</td></tr>
                <tr><td>门票</td><td>¥{{ budget.ticket }}</td><td>{{ state.stu ? '学生半价' : '全价' }} · 主要收费景点</td></tr>
                <tr><td>吃饭</td><td>¥{{ budget.foodLo }}—{{ budget.foodHi }}</td><td>40—80 元/天</td></tr>
                <tr><td>市内交通</td><td>¥{{ budget.trLo }}—{{ budget.trHi }}</td><td>地铁公交 10—20 元/天</td></tr>
                <tr><td><b>合计</b></td><td><b>约 ¥{{ totalLo }}—{{ totalHi }}</b></td><td>不含购物</td></tr>
              </tbody>
            </table>
            <p class="empty" style="margin:6px 0 0">高铁学生票仅限家庭—学校区间未计入；门票为代表性景点估算，以现场为准。</p>
          </details>
        </aside>
        <div class="plan-main">
          <div class="timeline">
            <DayCard v-for="(s, i) in state.planSlots" :key="i" :s="s" :i="i" :last="state.planSlots.length - 1"
                     @move="moveSlot" @dragfrom="dragFrom = $event" @drop="onDrop" />
          </div>
          <p v-if="leftoverNames.length" class="warn-line"><van-icon :name="I.warn" />这几座没排进当前天数：{{ leftoverNames.join('、') }}。可减少高峰留杭、增加天数，或拖掉某天换成它们。</p>
          <p v-else-if="!state.picked.some(id => id !== 'hz') && !state.picked.includes('hz')" class="warn-line"><van-icon :name="I.warn" />还没选外地城市：填满模式会用杭州主题日铺满；想去外地请先点城市卡片。</p>
        </div>
      </div>
    </template>
    <van-empty v-else description="还没生成行程：去「选城」挑城市，再点「生成行程」" />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import DayCard from './DayCard.vue'
import PlanDashboard from './PlanDashboard.vue'
import BudgetChart from './BudgetChart.vue'
import { I } from '../icons.js'
import { state, budget, leftoverNames, moveSlot, planText, days } from '../store.js'
import { buildPlanIcs, buildSaleIcs, downloadIcs, copyText, encodeShare } from '../share.js'
import { showToast } from 'vant'

const totalLo = computed(() => budget.value.fare + budget.value.ticket + budget.value.foodLo + budget.value.trLo)
const totalHi = computed(() => budget.value.fare + budget.value.ticket + budget.value.foodHi + budget.value.trHi)
const dragFrom = ref(null)

function onDrop(i) {
  if (dragFrom.value !== null) moveSlot(dragFrom.value, i)
  dragFrom.value = null
}

async function copyPlan() {
  const text = planText()
  const ok = await copyText(text)
  showToast(ok ? '行程已复制到剪贴板' : '复制失败，请手动选择文本')
}

function fileName(name) {
  return name + '-' + state.tripStart + '-' + days.value + 'd.ics'
}

function exportPlanIcs() {
  if (!state.planSlots.length) { showToast('还没生成行程'); return }
  const ics = buildPlanIcs(state.planSlots, state.tripStart)
  downloadIcs(fileName('行程'), ics)
  showToast('已生成 .ics（手机日历可直接导入）')
}

function exportSaleIcs() {
  if (!state.tripStart) { showToast('还没设出发日'); return }
  const ics = buildSaleIcs(state.tripStart, days.value)
  downloadIcs('12306-开售提醒.ics', ics)
  showToast('已生成开售提醒 .ics')
}

async function copyShareLink() {
  const qs = encodeShare(state)
  const base = location.origin + location.pathname
  const hash = location.hash || '#plan'
  const url = base + (qs ? '?' + qs : '') + hash
  const ok = await copyText(url)
  showToast(ok ? '分享链接已复制' : '复制失败，请手动复制地址栏 URL')
}
</script>
