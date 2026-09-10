<template>
  <article class="day" draggable="true" :class="{ dragging }"
           @dragstart="onDragStart" @dragend="dragging = false"
           @dragover.prevent @drop.prevent="onDrop">
    <div class="when-row">
      <div class="when"><van-icon :name="I.calendar" />{{ date.d }} {{ date.w }} · 第 {{ i + 1 }} 天</div>
      <div class="mv">
        <button type="button" title="上移一天" :disabled="i === 0" @click.stop="$emit('move', i, i - 1)"><van-icon :name="I.up" /></button>
        <button type="button" title="下移一天" :disabled="i === last" @click.stop="$emit('move', i, i + 1)"><van-icon :name="I.down" /></button>
      </div>
    </div>
    <h3>{{ slotTitle(s) }}</h3>
    <div class="row">
      <IconBadge :icon="I.clock" variant="strong">{{ b.time }}</IconBadge>
      <IconBadge :icon="I.money" variant="strong">单程约 {{ b.price }}</IconBadge>
    </div>
    <div class="slots"><div><b><van-icon :name="I.food" />便宜吃</b> {{ (b.foods || []).join('、') }}</div></div>
    <div v-if="b.tl" class="tl">
      <div v-for="(t, ti) in b.tl" :key="ti" class="tl-row"><span class="tl-t">{{ t[0] }}</span><span>{{ t[1] }}</span></div>
    </div>
    <div v-else class="slots">
      <div><b><van-icon :name="I.clock" />上午</b> {{ b.am }}</div>
      <div><b><van-icon :name="I.clock" />下午</b> {{ b.pm }}</div>
      <div><b><van-icon :name="I.clock" />傍晚</b> {{ b.eve }}</div>
    </div>
    <div v-if="b.booking" class="note"><van-icon :name="I.tip" /><span>{{ b.booking }}</span></div>
    <SearchLinks :q="q" />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { state, slotTitle, slotBody, dateAt, cityById } from '../store.js'
import { I } from '../icons.js'
import IconBadge from './IconBadge.vue'
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
