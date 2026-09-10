<template>
  <span class="badge" :class="variant">
    <van-icon :name="icon" v-if="icon" />
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },     // van-icon name（推荐从 icons.js 的 I 映射取）
  text: { type: String, default: '' },
  variant: { type: String, default: '' },    // strong / warn / cheap
})
</script>
