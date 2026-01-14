<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { createElectronTooltipWindowClient } from '../../renderer/windowClient'
import MyTooltipCard from './MyTooltipCard.vue'

const rootEl = ref<HTMLElement | null>(null)
const client = createElectronTooltipWindowClient({
  invoke: (channel, ...args) => (window as any).invoke(channel, ...args),
  onIpc: (channel, listener) => (window as any).onIpc(channel, listener),
})

const ready = ref(false)
const payload = ref(client.getState().payload)

const registry = { MyTooltipCard } as const
const resolvedComponent = computed(() => {
  const name = payload.value.content.component?.name
  if (!name)
    return null
  return (registry as any)[name] ?? null
})

const resolvedProps = computed<Record<string, any>>(() => payload.value.content.component?.props ?? {})

async function reportSize() {
  await nextTick()
  const el = rootEl.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  client.reportSize({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) })
}

onMounted(() => {
  client.subscribe((s) => {
    ready.value = s.ready
    payload.value = s.payload
    if (s.ready)
      reportSize()
  })
  client.start()
})

function onEnter() {
  client.setTooltipHovered(true)
}
function onLeave() {
  client.setTooltipHovered(false)
}
</script>

<template>
  <div ref="rootEl" :style="{ opacity: ready ? 1 : 0 }" @mouseenter="onEnter" @mouseleave="onLeave">
    <component v-if="resolvedComponent" :is="resolvedComponent" v-bind="resolvedProps" />
    <div v-else>{{ payload.content.text }}</div>
  </div>
</template>
