<template>
  <section class="panel">
    <h2><van-icon :name="I.tip" />出行备忘</h2>
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
import { saleRows } from '../store.js'
import { I } from '../icons.js'
</script>
