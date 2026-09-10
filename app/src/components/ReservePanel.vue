<template>
  <section class="reserve-panel">
    <h2>预约景点清单</h2>
    <p class="empty">把想去的预约景点圈出来，系统会按当地游览顺序生成路线；选中预约景点时会自动加入对应城市。</p>
    <div class="reserve-toolbar">
      <span class="reserve-count">已选 {{ state.reservationPicked.length }} 个预约景点</span>
      <van-button type="primary" size="small" @click="genRoute">生成预约路线</van-button>
    </div>
    <div class="reserve-list">
      <div v-for="g in reserveGroups" :key="g.city.id" class="reserve-group">
        <h3>{{ g.city.emoji }} {{ g.city.name }}</h3>
        <div class="reserve-list">
          <div v-for="r in g.list" :key="r.id" class="reserve-item" :class="{ selected: isRes(r.id) }" @click="toggleReservation(r.id)">
            <span class="circle-check">{{ isRes(r.id) ? '✓' : '' }}</span>
            <span class="reserve-copy">
              <b>{{ r.name }}</b>
              <span class="a">{{ r.kind }} · {{ r.detail }}</span>
              <span class="t">{{ r.window }} · {{ r.duration }}</span>
            </span>
          </div>
        </div>
      </div>
      <p v-if="!reserveGroups.length" class="empty">当前没有可预约景点。</p>
    </div>
    <div ref="routeBox" class="route-result">
      <template v-if="state.showReserveRoute && reserveRouteGroups.length">
        <h3>我的预约游览路线</h3>
        <div v-for="g in reserveRouteGroups" :key="g.city.id" class="route-card">
          <div class="route-line">{{ g.city.emoji }} {{ g.city.name }}：杭州出发 → {{ g.list.map(r => r.name).join(' → ') }} → 回杭州</div>
          <div class="empty">当地建议顺序：{{ g.list.map(r => r.route).join('；') }}</div>
          <div v-for="r in g.list" :key="r.id" class="route-step"><strong>{{ r.name }}</strong><span>{{ r.window }} · {{ r.duration }} · {{ r.kind }}</span></div>
          <SearchLinks :q="g.city.name + ' ' + g.list.map(r => r.name).join(' ')" />
        </div>
      </template>
      <p v-else class="empty">{{ routeHint }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { state, reserveGroups, reserveRouteGroups, toggleReservation, isRes } from '../store.js'
import SearchLinks from './SearchLinks.vue'

const routeBox = ref(null)

const routeHint = computed(() => {
  if (state.showReserveRoute) return '先圈选想去的预约景点，再点"生成预约路线"。'
  if (state.reserveDirty) return '预约景点已更新，点"生成预约路线"查看路线。'
  return '先圈选想去的预约景点，再点"生成预约路线"。'
})

async function genRoute() {
  state.showReserveRoute = true
  await nextTick()
  if (routeBox.value) routeBox.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
</script>
