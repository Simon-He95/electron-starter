<script setup lang="ts">
import type { TooltipSetPayload } from '../../../shared/schemas'
import { computed, nextTick, onMounted, ref } from 'vue'

type Placement = TooltipSetPayload['placement']

const payload = ref<TooltipSetPayload>({
  content: { text: '' },
  placement: 'top',
  maxWidth: 320,
})
const ready = ref(false)

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

async function reportSize() {
  await nextTick()
  const el = document.getElementById('electron-tooltip-root')
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  await window.invoke('tooltipReportSize', {
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  })
}

onMounted(() => {
  document.documentElement.classList.add('electron-tooltip-window')
  document.body.style.background = 'transparent'
  document.body.style.margin = '0'

  window.onIpc('tooltip-set', (p: TooltipSetPayload) => {
    payload.value = p
    ready.value = true
    reportSize()
  })

  // Handshake: tell main process we're ready to receive tooltip-set events.
  // `did-finish-load` can fire before Vue has mounted and registered listeners.
  window.invoke('tooltipRendererReady')
})

function onEnter() {
  window.invoke('tooltipSetTooltipHovered', true)
}
function onLeave() {
  window.invoke('tooltipSetTooltipHovered', false)
}
</script>

<template>
  <div
    id="electron-tooltip-root"
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
      <div v-if="payload.content.text" class="whitespace-pre-wrap break-words">
        {{ payload.content.text }}
      </div>
      <!-- NOTE: only use html when content is trusted/sanitized -->
      <div v-else-if="payload.content.html" class="prose prose-sm max-w-none" v-html="payload.content.html" />
    </div>
  </div>
</template>
