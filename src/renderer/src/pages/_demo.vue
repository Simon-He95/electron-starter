<script setup lang="ts">
import useCountStore from '@stores/count'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '../components/shadcn/ui/button'

const countStore = useCountStore()
const routes = useRoute()
const winId = routes.query.__winId as string
const isSuccessed = ref<boolean>()
async function updateSize(type: 'large' | 'small') {
  isSuccessed.value = await window.api.send('updateWindowBounds', {
    id: winId,
    bounds: { width: type === 'large' ? 800 : 200, height: type === 'large' ? 600 : 200 }
  })
}
onMounted(() => {
  window.api.on('window-blur', (...args) => {
    // eslint-disable-next-line no-console
    console.log('window-blur in demo.vue', args)
  })
})
</script>

<template>
  <div class="prose max-w-2xl mx-auto mt-6 p-6">
    <div class="flex items-center gap-4">
      <img alt="logo" class="logo w-14 h-14" src="../assets/electron.svg" />
      <div>
        <h2 class="text-lg font-semibold">Demo Window</h2>
        <p class="text-sm text-muted-foreground">A small demo page showing a polished dialog.</p>
      </div>
    </div>

    <div class="mt-6 flex items-center gap-3">
      <Button variant="secondary" @click="countStore.increment">
        Click me ({{ countStore.count }})
      </Button>
      <Button @click="updateSize('large')"> 放大 </Button>
      <Button @click="updateSize('small')"> 缩小 </Button>
    </div>
    <div class="text-center">
      {{ typeof isSuccessed === 'boolean' ? (isSuccessed ? '操作成功' : '操作失败') : '' }}
    </div>
  </div>
</template>
