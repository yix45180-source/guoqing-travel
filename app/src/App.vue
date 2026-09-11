<template>
  <div class="wrap">
    <HeroCover />
    <nav class="toc">
      <button v-for="t in TABS" :key="t.id" type="button" :class="{ on: state.activeTab === t.id }" @click="goTab(t.id)">
        {{ t.label }}
        <span v-if="t.id === 'pick' && state.picked.length" class="cnt">{{ state.picked.length }}</span>
        <span v-if="t.id === 'reserve' && state.reservationPicked.length" class="cnt">{{ state.reservationPicked.length }}</span>
        <span v-if="t.id === 'plan' && state.planSlots.length" class="cnt">{{ state.planSlots.length }}</span>
      </button>
      <button class="theme-toggle" type="button" :title="themeTitle" @click="cycleTheme" aria-label="切换主题">
        <span class="ic">{{ themeIcon }}</span>
        <span class="lbl">{{ themeLabel }}</span>
      </button>
    </nav>
    <CityPicker v-show="state.activeTab === 'pick'" class="tabpane" />
    <ReservePanel v-show="state.activeTab === 'reserve'" class="tabpane" />
    <PlanPanel v-show="state.activeTab === 'plan'" class="tabpane" />
    <EatsPanel v-show="state.activeTab === 'eats'" class="tabpane" />
    <MemoPanel v-show="state.activeTab === 'memo'" class="tabpane" />
    <div class="foot">车程 / 票价为 2026-09 查询整理，以 12306 当天为准 · 时间表为参考节奏，节假日排队请预留 30—60 分钟余量<br>店铺口碑以小红书、点评实时为准 · 美食清单为学生党平价向整理，不代表商家合作。</div>
    <van-back-top right="18" bottom="90" />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import HeroCover from './components/HeroCover.vue'
import CityPicker from './components/CityPicker.vue'
import ReservePanel from './components/ReservePanel.vue'
import PlanPanel from './components/PlanPanel.vue'
import EatsPanel from './components/EatsPanel.vue'
import MemoPanel from './components/MemoPanel.vue'
import { state, setTab, scrollToTab, TABS, applyTheme, setTheme, autoDayCount, regen } from './store.js'
import { decodeShare, applyShare } from './share.js'

function goTab(id) {
  setTab(id)
  scrollToTab()
}

const themeIcon = computed(() => state.theme === 'dark' ? '🌙' : (state.theme === 'light' ? '☀️' : '🌓'))
const themeLabel = computed(() => state.theme === 'dark' ? '深色' : (state.theme === 'light' ? '浅色' : '自动'))
const themeTitle = computed(() => state.theme === 'dark' ? '当前深色，点击切换到自动' : (state.theme === 'light' ? '当前浅色，点击切换到深色' : '当前跟随系统，点击切换到浅色'))

function cycleTheme() {
  // auto → light → dark → auto
  setTheme(state.theme === 'auto' ? 'light' : state.theme === 'light' ? 'dark' : 'auto')
}

onMounted(() => {
  // 优先从 URL ?p=... 还原分享状态（仅在无本地存档时覆盖）
  const sp = decodeShare(location.search)
  if (Object.keys(sp).length) {
    applyShare(state, sp)
    autoDayCount(); regen()
  }
  applyTheme()
  setTab(location.hash.slice(1))
  window.addEventListener('hashchange', () => setTab(location.hash.slice(1)))
})
</script>
