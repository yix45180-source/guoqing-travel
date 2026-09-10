<template>
  <header class="hero hero-cover">
    <div class="hero-copy">
      <span class="hero-kicker">Holiday route studio</span>
      <h1>余杭出发<br>去江南吃一圈</h1>
      <p>把高铁当天往返、预约景点和糯叽叽美食，排成一份真的能出发的假期计划。</p>
      <div class="hero-actions">
        <button class="hero-btn" type="button" @click="go('pick')">开始选城市 <span aria-hidden="true">→</span></button>
        <button class="hero-ghost" type="button" @click="go('plan')">查看我的路线</button>
      </div>
      <div class="hero-note"><b>{{ dateChip }}</b><br>当天去、当天回，晚上回余杭睡。</div>
    </div>
    <MapCard />
  </header>
</template>

<script setup>
import MapCard from './MapCard.vue'
import { dateChip, setTab, scrollToTab } from '../store.js'

function go(id) {
  setTab(id)
  scrollToTab()
}
</script>
