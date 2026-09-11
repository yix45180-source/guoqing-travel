<template>
  <section class="panel">
    <h2><van-icon :name="I.tip" />出行备忘</h2>

    <div class="countdown-card" v-if="sale">
      <div class="countdown-emoji">⏰</div>
      <div class="countdown-body">
        <p class="countdown-title">下一个开售日：{{ saleLabel }}（{{ sale.note }}）</p>
        <div class="countdown-time">
          <span>{{ d }}</span><span class="unit">天</span>
          <span>{{ hh }}</span><span class="unit">:</span>
          <span>{{ mm }}</span><span class="unit">:</span>
          <span>{{ ss }}</span>
        </div>
        <p class="countdown-sub">12306 早 8:30 开售，提前 15 天含当天。关掉本页面提醒会失效，建议用「导出抢票提醒」生成日历事件。</p>
      </div>
      <div class="countdown-actions">
        <van-button size="small" type="primary" :icon="I.warn" @click="notifySale">开售前提醒我</van-button>
        <van-button size="small" plain type="primary" :icon="I.calendar" @click="exportSale">导出发送提醒</van-button>
      </div>
    </div>

    <h4><van-icon :name="I.calendar" />12306 预售（提前 15 天含当天，按当前出行日期）</h4>
    <table>
      <thead><tr><th>乘车日</th><th>开售日</th><th>备注</th></tr></thead>
      <tbody>
        <tr v-for="(r, i) in saleRows" :key="i">
          <td>{{ r.ride }}</td>
          <td>{{ r.sale }}</td>
          <td>{{ r.note }}</td>
        </tr>
      </tbody>
    </table>
    <p class="empty" style="margin:6px 0 0">2027 年放假安排为预估，以官方通知为准；不合意可点上面的自定义日期微调。</p>
    <div class="memo-links">
      <van-button size="small" plain type="primary" :icon="I.train" tag="a" href="https://www.12306.cn/" target="_blank" rel="noopener">打开 12306</van-button>
      <van-button size="small" plain type="primary" :icon="I.note" tag="a" href="https://www.xiaohongshu.com/search_result?keyword=%E5%9B%BD%E5%BA%86%E9%AB%98%E9%93%81%E6%8A%A2%E7%A5%A8" target="_blank" rel="noopener">小红书搜国庆抢票</van-button>
    </div>
    <van-divider :hairline="false" />
    <h4><van-icon :name="I.warn" />西湖 2026 秋季节假日</h4>
    <ul>
      <li>8:00—17:00 景区单双号限行，新能源、临时号牌、非浙 A 都算。别自驾进西湖。</li>
      <li>灵隐飞来峰免票，必须「杭州灵隐飞来峰」小程序实名预约，不再现场登记。</li>
      <li>学生证部分景点半价；糕团店尽量上午去，下午常卖完。</li>
    </ul>
    <van-divider :hairline="false" />
    <h4><van-icon :name="I.location" />常见买错站</h4>
    <ul>
      <li>去苏州古城买<strong>苏州站</strong>，不要买苏州南（吴江黎里，离古城约 45 公里）。</li>
      <li>去临海紫阳街买<strong>临海站</strong>，不要买台州站（黄岩）。</li>
      <li>去绍兴古城买<strong>绍兴北</strong>（高铁站），再进城。</li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { saleRows, days, state } from '../store.js'
import { saleCountdown, buildSaleIcs, downloadIcs } from '../share.js'
import { I } from '../icons.js'
import { showToast } from 'vant'

const tick = ref(Date.now())
let timer = null
onMounted(() => { timer = setInterval(() => { tick.value = Date.now() }, 1000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const sale = computed(() => { void tick.value; return saleCountdown(state.tripStart, days.value) })
const saleLabel = computed(() => sale.value ? formatSale(sale.value.saleAt) + ' · ' + sale.value.rideLabel : '')

const d = computed(() => sale.value ? Math.floor(sale.value.diff / 86400000) : 0)
const hh = computed(() => sale.value ? pad(Math.floor((sale.value.diff % 86400000) / 3600000)) : '00')
const mm = computed(() => sale.value ? pad(Math.floor((sale.value.diff % 3600000) / 60000)) : '00')
const ss = computed(() => sale.value ? pad(Math.floor((sale.value.diff % 60000) / 1000)) : '00')

function pad(n) { return n < 10 ? '0' + n : '' + n }
function formatSale(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function notifySale() {
  if (!sale.value) { showToast('所有开售日已过期'); return }
  if (typeof Notification === 'undefined') { showToast('当前浏览器不支持通知'); return }
  if (Notification.permission === 'granted') {
    armNotify()
    showToast('已开启开售前 10 分钟提醒（页面保持打开）')
  } else if (Notification.permission === 'denied') {
    showToast('通知已被禁用，请在浏览器设置里允许')
  } else {
    Notification.requestPermission().then(p => {
      if (p === 'granted') { armNotify(); showToast('已开启开售前 10 分钟提醒') }
      else showToast('未授权，将无法提醒')
    })
  }
}

let notifyTimer = null
function armNotify() {
  if (!sale.value || notifyTimer) return
  const fireAt = sale.value.saleAt.getTime() - 10 * 60 * 1000
  const delay = fireAt - Date.now()
  if (delay <= 0) { showToast('距开售不到 10 分钟，请直接去 12306'); return }
  notifyTimer = setTimeout(() => {
    try {
      new Notification('12306 即将开售', { body: '10 分钟后开售 ' + sale.value.rideLabel + ' 的车票' })
    } catch (e) {}
    notifyTimer = null
  }, delay)
}

function exportSale() {
  if (!state.tripStart) { showToast('还没设出发日'); return }
  const ics = buildSaleIcs(state.tripStart, days.value)
  downloadIcs('12306-开售提醒.ics', ics)
  showToast('已生成开售提醒 .ics')
}
</script>
