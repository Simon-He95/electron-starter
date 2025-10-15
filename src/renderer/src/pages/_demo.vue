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
      <Button variant="secondary" @click="countStore.increment">
        Click me ({{ countStore.count }})
      </Button>
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
  </div>
</template>
