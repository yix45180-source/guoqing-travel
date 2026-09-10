<template>
  <section class="city" :class="{ picked: on, open: expanded }">
    <div class="c-head" @click="toggleOpen">
      <div class="c-emoji">{{ c.emoji }}</div>
      <div class="c-title">
        <h3>{{ c.name }}</h3>
        <div class="sub">{{ c.sub }}</div>
        <div class="sub" style="font-size:11px;margin-top:3px;color:#7a5216"><van-icon :name="I.train" /> 高铁 {{ c.time }} · 约 {{ c.price }} · {{ rtTxt(c.id) }}</div>
      </div>
      <div style="text-align:right">
        <div class="stars">{{ star(c.stars) }}</div>
        <div class="sub" style="font-size:11px">{{ c.tag }}</div>
      </div>
      <div class="check" title="选入行程" @click.stop="toggleCity(c.id)">
        <van-icon v-if="on" :name="I.success" />
      </div>
    </div>
    <div class="c-body">
      <div class="row">
        <IconBadge :icon="I.clock" variant="strong">{{ c.time }}</IconBadge>
        <IconBadge :icon="I.money" variant="strong">{{ c.price }}</IconBadge>
        <IconBadge :icon="I.route">{{ rtTxt(c.id) }}</IconBadge>
        <IconBadge v-if="c.warn" :icon="I.warn" variant="warn">{{ c.warn }}</IconBadge>
      </div>
      <h4><van-icon :name="I.spot" />景点</h4>
      <ul>
        <li v-for="sp in c.spots" :key="sp[0]">
          <span class="n">{{ sp[0] }}</span> <span class="a">· {{ sp[1] }}</span>
          <span v-if="sp[2]" class="t">（{{ sp[2] }}）</span>
        </li>
      </ul>
      <div v-if="reservationsFor(c.id).length" class="reserve-inline">
        <h4><van-icon :name="I.calendar" />当地预约景点</h4>
        <div class="reserve-list">
          <div v-for="r in reservationsFor(c.id)" :key="r.id" class="reserve-item" :class="{ selected: isRes(r.id) }" @click="toggleReservation(r.id)">
            <span class="circle-check"><van-icon v-if="isRes(r.id)" :name="I.success" /></span>
            <span class="reserve-copy">
              <b><van-icon :name="I.spot" />{{ r.name }}</b>
              <span class="a"><van-icon :name="I.ticket" />{{ r.kind }} · {{ r.detail }}</span>
              <span class="t"><van-icon :name="I.clock" />{{ r.window }} · {{ r.duration }}</span>
            </span>
          </div>
        </div>
      </div>
      <h4><van-icon :name="I.food" />便宜好吃</h4>
      <ul>
        <li v-for="f in c.foods" :key="f.n">
          <span class="n">{{ f.n }}</span> <span class="a">{{ f.a }}</span> <span class="t">{{ f.price }} — {{ f.why }}</span>
          <van-tag v-if="f.cheap" style="margin:0 4px" color="#2f6f5e" plain>平价</van-tag>
          <SearchLinks :q="c.name.replace(/[（(].*/, '') + ' ' + f.n" />
        </li>
      </ul>
      <SearchLinks :q="c.name + ' 便宜美食 学生'" />
      <div v-if="c.booking" class="note"><van-icon :name="I.tip" /><span>预约：{{ c.booking }}</span></div>
      <div v-if="c.tips" class="note"><van-icon :name="I.tip" /><span>{{ c.tips }}</span></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { state, toggleCity, toggleReservation, reservationsFor, isRes, rtTxt, star } from '../store.js'
import { I } from '../icons.js'
import IconBadge from './IconBadge.vue'
import SearchLinks from './SearchLinks.vue'

const props = defineProps({ c: { type: Object, required: true } })

const on = computed(() => state.picked.includes(props.c.id))
const expanded = computed(() => on.value || !!state.openCity[props.c.id])

function toggleOpen() {
  state.openCity[props.c.id] = state.openCity[props.c.id] ? 0 : 1
}
</script>
