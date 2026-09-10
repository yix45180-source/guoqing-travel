<template>
  <section class="panel">
    <h2>跨城便宜美食</h2>
    <div class="filters">
      <button v-for="f in foodFilters" :key="f[0]" type="button" class="seg" :class="{ on: state.foodFilter === f[0] }" @click="state.foodFilter = f[0]">{{ f[1] }}</button>
    </div>
    <div class="food-card">
      <div v-for="(it, ix) in eatItems" :key="ix" class="food-item">
        <div><b>{{ it.f.n }}</b> · {{ it.c.name }} <van-tag v-if="it.f.cheap" style="margin-left:4px" color="#2f6f5e" plain>平价</van-tag></div>
        <div class="a">{{ it.f.a }} · {{ it.f.price }}</div>
        <div>{{ it.f.why }}</div>
        <SearchLinks :q="it.c.name.replace(/[（(].*/, '') + ' ' + it.f.n" />
      </div>
      <van-empty v-if="!eatItems.length" description="没有符合筛选的店。" />
    </div>
  </section>
</template>

<script setup>
import { state, eatItems } from '../store.js'
import SearchLinks from './SearchLinks.vue'

const foodFilters = [['all', '全部'], ['cheap', '人均约 20 元内'], ['picked', '只看已选城市']]
</script>
