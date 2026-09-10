<template>
  <section class="dash">
    <div class="dash-head">
      <div>
        <div class="dash-kicker">TRIP OVERVIEW</div>
        <h2>行程概览</h2>
      </div>
      <div class="dash-date">{{ dateChip }}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-emoji">📅</div>
        <div class="kpi-body">
          <div class="kpi-val">{{ d.days }}<span class="kpi-unit">天</span></div>
          <div class="kpi-label">总行程</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-emoji">🏙️</div>
        <div class="kpi-body">
          <div class="kpi-val">{{ d.cityCount }}<span class="kpi-unit">座</span></div>
          <div class="kpi-label">已选城市（外地 {{ d.nonHzCount }}）</div>
        </div>
      </div>
      <div class="kpi kpi-accent">
        <div class="kpi-emoji">💰</div>
        <div class="kpi-body">
          <div class="kpi-val">¥{{ d.totalMid }}<span class="kpi-unit">·约</span></div>
          <div class="kpi-label">预估总花费（¥{{ d.totalLo }}—{{ d.totalHi }}）</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-emoji">🪙</div>
        <div class="kpi-body">
          <div class="kpi-val">¥{{ d.avgPerDay }}</div>
          <div class="kpi-label">日均花费</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-emoji">🚄</div>
        <div class="kpi-body">
          <div class="kpi-val">¥{{ d.fare }}</div>
          <div class="kpi-label">高铁往返合计</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-emoji">🎫</div>
        <div class="kpi-body">
          <div class="kpi-val">¥{{ d.ticket }}</div>
          <div class="kpi-label">门票（{{ state.stu ? '学生价' : '全价' }}）</div>
        </div>
      </div>
      <div class="kpi" v-if="d.reservedCount">
        <div class="kpi-emoji">📌</div>
        <div class="kpi-body">
          <div class="kpi-val">{{ d.reservedCount }}</div>
          <div class="kpi-label">需预约景点</div>
        </div>
      </div>
      <div class="kpi kpi-warn" v-if="d.leftoverCount">
        <div class="kpi-emoji">⚠️</div>
        <div class="kpi-body">
          <div class="kpi-val">{{ d.leftoverCount }}</div>
          <div class="kpi-label">未排入城市</div>
        </div>
      </div>
    </div>

    <div class="dash-actions">
      <a class="dash-link" :href="trainLink" target="_blank" rel="noopener">🚄 12306 抢票</a>
      <a class="dash-link" :href="amapLink" target="_blank" rel="noopener">📍 高德地图</a>
      <button class="dash-link dash-link--ghost" type="button" @click="$emit('copy')">📋 复制行程</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { state, dashboard, dateChip } from '../store.js'

defineEmits(['copy'])

const d = dashboard

const trainLink = computed(() => 'https://www.12306.cn/index/')
const amapLink = computed(() => 'https://ditu.amap.com/')
</script>
