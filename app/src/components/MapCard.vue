<template>
  <div class="hero-map-card">
    <div class="map-card-top"><strong>点地图选城</strong><span class="map-status">{{ status }}</span></div>
    <div class="map-shell">
      <svg class="china-map" viewBox="0 0 620 430" role="img" aria-label="华东旅行互动地图">
        <path class="china-outline" d="M94 111 125 83 166 77 198 58 237 64 270 47 307 58 339 43 373 55 407 50 435 67 476 71 493 89 531 94 550 119 536 141 557 160 543 182 518 194 526 218 509 239 500 267 477 277 467 305 448 324 433 355 406 349 385 328 355 327 331 315 302 319 276 304 248 302 228 285 199 281 181 263 158 252 161 230 139 214 126 190 104 175 112 149 86 132Z"></path>
        <path class="china-island" d="M477 345 490 356 486 374 474 384 466 373 469 356Z"></path>
        <path class="china-island" d="M527 326 537 329 541 337 533 342 525 337Z"></path>
        <path class="map-route" :d="mapRouteD"></path>
        <g v-for="p in pins" :key="p.id" class="map-pin" :class="{ selected: p.selected }"
           :transform="'translate(' + p.x + ' ' + p.y + ')'" role="button" tabindex="0"
           :aria-label="'选择' + p.name"
           @click="toggleCity(p.id)"
           @keydown.enter.prevent="toggleCity(p.id)"
           @keydown.space.prevent="toggleCity(p.id)">
          <circle :r="p.big ? 11 : 10"></circle>
          <circle :r="p.big ? 5 : 4"></circle>
          <text :x="p.lx" :y="p.ly">{{ p.name }}</text>
        </g>
      </svg>
    </div>
    <div class="map-legend"><span><i class="map-dot start"></i>余杭出发</span><span><i class="map-dot"></i>点击选城</span><span>线条会跟着选择变化</span></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CITIES, MAP_POINTS } from '../data.js'
import { toggleCity, mapSelected, mapRouteD } from '../store.js'

const LABEL = { nj: [-18, -13], yz: [-18, -13], wx: [-18, -13], sz: [-18, -13], sh: [10, 4], nx: [-32, -13], sx: [10, 4], hz: [10, 4], lh: [10, 4] }
const NAME = { hz: '杭州', nx: '南浔', lh: '临海' }

const pins = computed(() => CITIES.filter(c => MAP_POINTS[c.id]).map(c => {
  const p = MAP_POINTS[c.id]
  const l = LABEL[c.id] || [-18, -13]
  return {
    id: c.id, x: p.x, y: p.y, big: c.id === 'hz',
    name: NAME[c.id] || c.name.replace(/[（(].*/, ''),
    lx: l[0], ly: l[1],
    selected: mapSelected.value.includes(c.id)
  }
}))

const status = computed(() => mapSelected.value.length ? '已选 ' + mapSelected.value.length + ' 座 · 再点可取消' : '点击城市标记加入计划')
</script>
