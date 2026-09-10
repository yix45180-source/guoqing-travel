<template>
  <article class="day" draggable="true" :class="{ dragging }"
           @dragstart="onDragStart" @dragend="dragging = false"
           @dragover.prevent @drop.prevent="onDrop">
    <div class="when-row">
      <div class="when">{{ date.d }} {{ date.w }} · 第 {{ i + 1 }} 天</div>
      <div class="mv">
        <button type="button" title="上移一天" :disabled="i === 0" @click.stop="$emit('move', i, i - 1)">↑</button>
        <button type="button" title="下移一天" :disabled="i === last" @click.stop="$emit('move', i, i + 1)">↓</button>
      </div>
    </div>
    <h3>{{ slotTitle(s) }}</h3>
    <div class="row">
      <span class="badge strong">{{ b.time }}</span>
      <span class="badge strong">单程约 {{ b.price }}</span>
    </div>
    <div class="slots"><div><b>便宜吃</b> {{ (b.foods || []).join('、') }}</div></div>
    <div v-if="b.tl" class="tl">
      <div v-for="(t, ti) in b.tl" :key="ti" class="tl-row"><span class="tl-t">{{ t[0] }}</span><span>{{ t[1] }}</span></div>
    </div>
    <div v-else class="slots">
      <div><b>上午</b> {{ b.am }}</div>
      <div><b>下午</b> {{ b.pm }}</div>
      <div><b>傍晚</b> {{ b.eve }}</div>
    </div>
    <div v-if="b.booking" class="note">{{ b.booking }}</div>
    <SearchLinks :q="q" />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { state, slotTitle, slotBody, dateAt, cityById } from '../store.js'
import SearchLinks from './SearchLinks.vue'

const props = defineProps({ s: { type: Object, required: true }, i: { type: Number, required: true }, last: { type: Number, required: true } })
const emit = defineEmits(['move', 'dragfrom', 'drop'])

const dragging = ref(false)
const b = computed(() => slotBody(props.s))
const date = computed(() => dateAt(props.i))
const q = computed(() => props.s.type === 'theme' ? '杭州 ' + props.s.theme.name + ' 美食' : (cityById(props.s.id).name + ' 便宜美食'))

function onDragStart(e) {
  dragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  emit('dragfrom', props.i)
}
function onDrop() {
  dragging.value = false
  emit('drop', props.i)
}
</script>
