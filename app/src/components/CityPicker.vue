<template>
  <div class="city-picker">
    <div class="search-box">
      <label>去网页搜好吃的（打开小红书 / 点评 / 高德）</label>
      <div class="search-row">
        <input v-model="q" placeholder="例如：临海 蛋清羊尾、苏州 万福兴、仓桥直街 便宜" @keydown.enter="openSearch('xhs')">
        <van-button type="primary" size="small" @click="openSearch('xhs')">小红书</van-button>
        <van-button size="small" @click="openSearch('dp')">大众点评</van-button>
        <van-button size="small" @click="openSearch('gd')">高德地图</van-button>
      </div>
      <p class="empty" style="margin:8px 0 0">站内是整理过的平价店，实时排队和口味以小红书、点评为准，本页不抓取笔记。</p>
    </div>

    <div class="bar">
      <h2>已选城市（点标签可取消）</h2>
      <div class="sel-list">
        <span v-if="!state.picked.length" class="empty">还没选，点下面卡片试试 →</span>
        <button v-for="id in state.picked" :key="id" type="button" class="sel-pill" @click="toggleCity(id)">
          {{ pill(id).emoji }} {{ pill(id).name }} <small>{{ pill(id).time }}</small> ×
        </button>
      </div>
      <div v-if="summaryTxt" class="summary">{{ summaryTxt }}</div>
      <div class="controls">
        <div class="ctrl">
          <div>出行日期（节假日快速选，2027 年为预估）</div>
          <div class="opts">
            <button v-for="h in holidayChips" :key="h.id" type="button" class="seg" :class="{ on: state.curHol === h.id }" @click="setHoliday(h.id)">{{ h.label }}</button>
          </div>
          <div class="opts" style="align-items:center">
            <input type="date" :value="state.tripStart" @change="setStartDate($event.target.value)"> <span class="empty">自定义出发日</span>
          </div>
        </div>
        <div class="ctrl">
          <div>行程模式</div>
          <div class="opts">
            <label class="opt" :class="{ on: state.mode === 'fill' }"><input type="radio" value="fill" :checked="state.mode === 'fill'" @change="setMode('fill')"> 填满假期 {{ state.fillDays }} 天</label>
            <label class="opt" :class="{ on: state.mode === 'fit' }"><input type="radio" value="fit" :checked="state.mode === 'fit'" @change="setMode('fit')"> 只排已选城市</label>
          </div>
        </div>
        <div class="ctrl">
          <div>天数（填满模式默认＝假期天数；只排模式默认＝已选城市数，均可手动改）</div>
          <div class="opts">
            <button v-for="i in 7" :key="i" type="button" class="seg" :class="{ on: days === i }" @click="setDays(i)">{{ i }} 天</button>
          </div>
        </div>
        <div class="ctrl switch-row">
          <span>高峰日（首尾两天）优先留杭州 · 天数不够时自动让位</span>
          <van-switch :model-value="state.peakHz" size="18px" @update:model-value="setPeak" />
        </div>
        <div class="ctrl switch-row">
          <span>门票按学生价估算（约半价）</span>
          <van-switch :model-value="state.stu" size="18px" @update:model-value="setStu" />
        </div>
      </div>
      <div class="actions">
        <van-button type="primary" size="small" :icon="I.route" @click="doPlan">生成行程</van-button>
        <van-button size="small" :icon="I.copy" @click="copyText">复制文字版</van-button>
        <van-button size="small" :icon="I.print" @click="printPage">打印</van-button>
        <van-button size="small" :icon="I.delete" @click="doClear">清空</van-button>
        <van-button size="small" :icon="I.success" @click="selectAll">全选</van-button>
      </div>
    </div>

    <div class="filters">
      <button v-for="f in filterOpts" :key="f[0]" type="button" class="seg" :class="{ on: state.cityFilter === f[0] }" @click="state.cityFilter = f[0]">{{ f[1] }}</button>
    </div>
    <CityCard v-for="c in filteredCities" :key="c.id" :c="c" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import CityCard from './CityCard.vue'
import { I } from '../icons.js'
import {
  state, days, summaryTxt, holidayChips, filteredCities, cityById,
  toggleCity, setHoliday, setStartDate, setMode, setDays, setStu, setPeak,
  genPlan, selectAll, clearAll, setTab, scrollToTab, planText, xhs, dp, gd
} from '../store.js'

const q = ref('')
const filterOpts = [['all', '全部'], ['easy', '1小时内车程'], ['cheap', '票价约百元内'], ['star', '四星以上']]

const pill = (id) => cityById(id) || { emoji: '', name: id, time: '' }

function openSearch(kind) {
  const query = q.value.trim() || '杭州 便宜 糕点'
  const url = kind === 'xhs' ? xhs(query) : kind === 'dp' ? dp(query) : gd(query)
  window.open(url, '_blank', 'noopener')
}

function doPlan() {
  genPlan()
  setTab('plan')
  scrollToTab()
}

async function copyText() {
  const out = planText()
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(out)
    } else {
      const ta = document.createElement('textarea')
      ta.value = out
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    showToast('已复制')
  } catch (e) {
    showToast('复制失败，可全选时间轴手动复制')
  }
}

function printPage() { window.print() }

function doClear() {
  clearAll()
  showToast('已清空')
}
</script>
