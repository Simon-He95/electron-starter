<script setup lang="ts">
import DemoTooltipCard from '@renderer/components/DemoTooltipCard.vue'
import DemoPopConfirm from '@renderer/components/DemoPopConfirm.vue'
import type { TooltipSetPayload } from '../../../plugins/electron-tooltip/schemas'
import { createElectronTooltipWindowClient } from '../../../plugins/electron-tooltip/renderer/windowClient'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

type Placement = TooltipSetPayload['placement']

const rootEl = ref<HTMLElement | null>(null)
const ready = ref(false)
const payload = ref<TooltipSetPayload>({
  id: '',
  content: { text: '' },
  placement: 'top',
  maxWidth: 320,
})

const contentStyle = computed(() => ({
  maxWidth: `${payload.value.maxWidth ?? payload.value.content.maxWidth ?? 320}px`,
}))

const placement = computed<Placement>(() => payload.value.placement)

const arrowWrapClass = computed(() => {
  switch (placement.value) {
    case 'top':
      return 'left-1/2 -translate-x-1/2 -bottom-[6px]'
    case 'bottom':
      return 'left-1/2 -translate-x-1/2 -top-[6px]'
    case 'left':
      return '-right-[6px] top-1/2 -translate-y-1/2'
    case 'right':
      return '-left-[6px] top-1/2 -translate-y-1/2'
    default:
      return 'left-1/2 -translate-x-1/2 -bottom-[6px]'
  }
})

const arrowSpec = computed(() => {
  switch (placement.value) {
    case 'top':
      return { width: 12, height: 6, viewBox: '0 0 12 6', d: 'M0 0L6 6L12 0Z' }
    case 'bottom':
      return { width: 12, height: 6, viewBox: '0 0 12 6', d: 'M0 6L6 0L12 6Z' }
    case 'left':
      return { width: 6, height: 12, viewBox: '0 0 6 12', d: 'M0 0L6 6L0 12Z' }
    case 'right':
      return { width: 6, height: 12, viewBox: '0 0 6 12', d: 'M6 0L0 6L6 12Z' }
    default:
      return { width: 12, height: 6, viewBox: '0 0 12 6', d: 'M0 0L6 6L12 0Z' }
  }
})

const componentRegistry = {
  DemoTooltipCard,
  DemoPopConfirm,
} as const

const resolvedComponent = computed(() => {
  const name = payload.value.content.component?.name
  if (!name)
    return null
  return (componentRegistry as Record<string, any>)[name] ?? null
})

const resolvedProps = computed<Record<string, any>>(() => payload.value.content.component?.props ?? {})
const injectedProps = computed(() => ({
  __closeTooltip: () => client.close(),
  __setPinned: (pinned: boolean) => client.setPinned(pinned),
}))

const client = createElectronTooltipWindowClient({
  invoke: (channel, ...args) => (window as any).invoke(channel, ...args),
  onIpc: (channel, listener) => (window as any).onIpc(channel, listener),
})

let unsubscribe: null | (() => void) = null

async function reportSize() {
  await nextTick()
  const el = rootEl.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  client.reportSize({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) })
}

onMounted(() => {
  document.documentElement.classList.add('electron-tooltip-window')
  document.body.style.background = 'transparent'
  document.body.style.margin = '0'

  unsubscribe = client.subscribe((s) => {
    ready.value = s.ready
    payload.value = s.payload
    if (s.ready)
      reportSize()
  })
  client.start()
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribe = null
  client.stop()
})

function onEnter() {
  client.setTooltipHovered(true)
}
function onLeave() {
  client.setTooltipHovered(false)
}
</script>

<template>
  <!-- This file is app-owned on purpose: replace this UI with your own tooltip content. -->
  <div
    ref="rootEl"
    class="w-fit h-fit p-2"
    :style="{ opacity: ready ? 1 : 0 }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      class="relative rounded-md border bg-popover text-popover-foreground shadow-[0_0_18px_rgba(0,0,0,0.12)] px-3 py-2 text-xs leading-relaxed"
      :style="contentStyle"
    >
      <div class="absolute pointer-events-none" :class="arrowWrapClass">
        <svg
          class="block drop-shadow-[0_0_10px_rgba(0,0,0,0.10)]"
          :width="arrowSpec.width"
          :height="arrowSpec.height"
          :viewBox="arrowSpec.viewBox"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path :d="arrowSpec.d" :fill="'hsl(var(--popover))'" :stroke="'hsl(var(--border))'" stroke-linejoin="round" />
        </svg>
      </div>
      <component
        v-if="resolvedComponent"
        :is="resolvedComponent"
        v-bind="{ ...resolvedProps, ...injectedProps }"
      />
      <div v-else-if="payload.content.text" class="whitespace-pre-wrap break-words">
        {{ payload.content.text }}
      </div>
      <div v-else-if="payload.content.html" class="prose prose-sm max-w-none" v-html="payload.content.html" />
    </div>
  </div>
</template>
