<template>
  <span class="links">
    <a :href="xhsUrl" target="_blank" rel="noopener">小红书</a>
    <a :href="dpUrl" target="_blank" rel="noopener">点评</a>
    <a :href="gdUrl" target="_blank" rel="noopener">高德</a>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { xhs, dp, gd } from '../store.js'

const props = defineProps({ q: { type: String, default: '' } })
const xhsUrl = computed(() => xhs(props.q))
const dpUrl = computed(() => dp(props.q))
const gdUrl = computed(() => gd(props.q))
</script>
