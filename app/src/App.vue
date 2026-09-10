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
import { onMounted } from 'vue'
import HeroCover from './components/HeroCover.vue'
import CityPicker from './components/CityPicker.vue'
import ReservePanel from './components/ReservePanel.vue'
import PlanPanel from './components/PlanPanel.vue'
import EatsPanel from './components/EatsPanel.vue'
import MemoPanel from './components/MemoPanel.vue'
import { state, setTab, scrollToTab, TABS } from './store.js'

function goTab(id) {
  setTab(id)
  scrollToTab()
}

onMounted(() => {
  setTab(location.hash.slice(1))
  window.addEventListener('hashchange', () => setTab(location.hash.slice(1)))
})
</script>
