<template>
  <section class="bdg">
    <div class="bdg-head">
      <div>
        <div class="dash-kicker">BUDGET</div>
        <h2>预算可视化</h2>
      </div>
      <div class="bdg-toggle">
        <button type="button" :class="{ on: mode === 'category' }" @click="mode = 'category'">按类别</button>
        <button type="button" :class="{ on: mode === 'city' }" @click="mode = 'city'">按城市</button>
      </div>
    </div>

    <div class="bdg-body" v-if="hasData">
      <v-chart v-if="chartReady" ref="chartRef" class="bdg-chart" :option="option" autoresize />
      <div v-else class="bdg-chart bdg-chart--placeholder"></div>
      <ul class="bdg-legend">
        <li v-for="r in legendRows" :key="r.name">
          <span class="lg-dot" :style="{ background: r.color }"></span>
          <span class="lg-name">{{ r.name }}</span>
          <span class="lg-val">¥{{ r.value }}</span>
          <span class="lg-pct">{{ r.pct }}%</span>
        </li>
      </ul>
    </div>
    <van-empty v-else description="先选城市并生成行程，预算会自动可视化" />
  </section>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, TitleComponent } from 'echarts/components'
import { LabelLayout, UniversalTransition, LegacyGridContainLabel } from 'echarts/features'
import { budgetByCategory, budgetByCity, dashboard, state } from '../store.js'

use([CanvasRenderer, PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, TitleComponent, LabelLayout, UniversalTransition, LegacyGridContainLabel])

const mode = ref('category')
const chartRef = ref(null)
const chartReady = ref(false)

// 切换到行程 tab 时，v-show 从 display:none 变为 block，需要手动触发 resize
function resizeChart() {
  nextTick(() => {
    const inst = chartRef.value
    if (inst && typeof inst.resize === 'function') inst.resize()
  })
}
// 首次进入 plan tab 后才渲染 v-chart，避免容器尺寸为 0 时的 echarts 初始化警告
// immediate: 组件常在「生成行程」的同一 tick 内才挂载（activeTab 已是 plan），不带 immediate 时 watch 永不触发
watch(() => state.activeTab, v => {
  if (v === 'plan') {
    if (!chartReady.value) chartReady.value = true
    resizeChart()
  }
}, { immediate: true })
onMounted(() => resizeChart())

const hasData = computed(() =>
  mode.value === 'category'
    ? budgetByCategory.value.length > 0
    : budgetByCity.value.length > 0
)

const legendRows = computed(() => {
  const list = mode.value === 'category' ? budgetByCategory.value : cityRows.value
  const total = list.reduce((s, x) => s + x.value, 0) || 1
  return list.map(r => ({ name: r.name, value: r.value, color: r.color, pct: Math.round(r.value / total * 100) }))
})

const cityRows = computed(() => {
  const palette = ['#c8542f', '#2f6f5e', '#b8860b', '#3d6a8f', '#a15a2b', '#7a5216', '#5a8a6b', '#c69262', '#9a6412']
  return budgetByCity.value.map((c, i) => ({
    name: c.emoji + ' ' + c.name,
    value: c.total,
    color: palette[i % palette.length],
  }))
})

const option = computed(() => {
  if (mode.value === 'category') {
    const data = budgetByCategory.value.map(r => ({ name: r.name, value: r.value, itemStyle: { color: r.color } }))
    return {
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['52%', '74%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n¥{c}', color: '#5a5145', fontSize: 12 },
        labelLine: { length: 10, length2: 8 },
        center: ['50%', '50%'],
        data,
      }],
      title: {
        text: '¥' + dashboard.value.totalMid,
        subtext: '预估合计',
        left: 'center',
        top: 'center',
        textStyle: { fontSize: 22, fontWeight: 700, color: '#242018' },
        subtextStyle: { fontSize: 12, color: '#8a8172' },
        textAlign: 'center',
      },
    }
  }
  // 按城市横向条形图
  const rows = cityRows.value
  return {
    grid: { left: 72, right: 36, top: 8, bottom: 8 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>¥${p[0].value}` },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eee7da' } }, axisLabel: { color: '#8a8172', fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: rows.map(r => r.name),
      inverse: true,
      axisLine: { lineStyle: { color: '#eee7da' } },
      axisLabel: { color: '#5a5145', fontSize: 12 },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: rows.map(r => ({ value: r.value, itemStyle: { color: r.color } })),
      barWidth: 16,
      itemStyle: { borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', formatter: '¥{c}', color: '#5a5145', fontSize: 12 },
    }],
  }
})
</script>
