<script setup lang="ts">
import useCountStore from '@stores/count'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '../components/shadcn/ui/button'

const countStore = useCountStore()
const routes = useRoute()
const winId = routes.query.__winId as string
const isSuccessed = ref<boolean>()

// parse params from route query or URL search
const params = ref<Record<string, any> | undefined>(undefined)
const hashRoute = ref<string | undefined>(undefined)

function parseParamsFromLocation() {
  try {
    // try route query first
    const q = (routes.query.params as string) ?? null
    if (q) {
      params.value = JSON.parse(String(q))
    }
    else {
      // fallback to search param `params`
      const s = new URLSearchParams(window.location.search)
      const p = s.get('params')
      if (p)
        params.value = JSON.parse(p)
    }
  }
  catch (e) {
    // ignore parse errors

    console.warn('failed to parse params', e)
  }

  // read hash route
  hashRoute.value = window.location.hash.replace(/^#/, '') || undefined
}
async function updateSize(type: 'large' | 'small') {
  isSuccessed.value = await window.invoke('updateWindowBounds', {
    id: winId,
    bounds: { width: type === 'large' ? 800 : 200, height: type === 'large' ? 600 : 200 },
  })
}
onMounted(() => {
  window.onIpc('window-blur', (...args) => {
    // eslint-disable-next-line no-console
    console.log('window-blur in demo.vue', args)
  })
  parseParamsFromLocation()
})
</script>

<template>
  <div class="prose max-w-2xl mx-auto mt-6 p-6">
    <div class="flex items-center gap-4">
      <img alt="logo" class="logo w-14 h-14" src="../assets/electron.svg">
      <div>
        <h2 class="text-lg font-semibold">
          Demo Window
        </h2>
        <p class="text-sm text-muted-foreground">
          A small demo page showing a polished dialog.
        </p>
      </div>
    </div>

    <div class="mt-6 flex items-center gap-3">
      <span v-electron-tooltip="'Detached BrowserWindow tooltip (hover me)'" class="inline-flex">
        <Button variant="secondary" @click="countStore.increment">
          Click me ({{ countStore.count }})
        </Button>
      </span>
      <span
        v-electron-tooltip="{
          component: { name: 'DemoTooltipCard', props: { title: '自定义组件 Tooltip', description: '在 tooltip 窗口里渲染组件（name + props）' } },
          placement: 'bottom',
          maxWidth: 360,
        }"
        class="inline-flex"
      >
        <Button variant="outline">
          组件 Tooltip
        </Button>
      </span>
      <span
        v-electron-tooltip="{
          component: { name: 'DemoPopConfirm', props: { title: '确认操作？', description: '手动关闭：点击按钮才关闭（不会因 blur 自动关闭）' } },
          behavior: 'manual',
          placement: 'bottom',
          maxWidth: 360,
        }"
        class="inline-flex"
      >
        <Button variant="outline">
          PopConfirm
        </Button>
      </span>
      <Button @click="updateSize('large')">
        放大
      </Button>
      <Button @click="updateSize('small')">
        缩小
      </Button>
    </div>
    <div class="text-center">
      {{ typeof isSuccessed === 'boolean' ? (isSuccessed ? '操作成功' : '操作失败') : '' }}
    </div>

    <div class="mt-6 prose-sm bg-surface p-4 rounded">
      <h3 class="text-base font-medium">
        Received params
      </h3>
      <pre class="whitespace-pre-wrap break-words">{{ params ? JSON.stringify(params, null, 2) : 'no params' }}</pre>
      <h3 class="text-base font-medium mt-3">
        Hash route
      </h3>
      <div>{{ hashRoute ?? 'none' }}</div>
    </div>

    <div class="mt-8">
      <h3 class="text-base font-medium">
        Tooltip edge cases
      </h3>
      <p class="text-sm text-muted-foreground">
        Move/resize this window, drag it near screen edges, or enter full screen to verify flipping and tracking.
      </p>
      <div class="mt-4 flex items-center justify-between gap-4">
        <div
          v-electron-tooltip="{ text: 'Prefer left; will flip if it overflows.' , placement: 'left' }"
          class="rounded border px-3 py-2 text-sm bg-background"
        >
          Hover (left)
        </div>
        <div
          v-electron-tooltip="{ text: 'Prefer right; will flip if it overflows.' , placement: 'right' }"
          class="rounded border px-3 py-2 text-sm bg-background"
        >
          Hover (right)
        </div>
      </div>
    </div>
  </div>
</template>
