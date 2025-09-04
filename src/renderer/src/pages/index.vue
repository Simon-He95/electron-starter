<script setup lang="ts">
import useCountStore from '@stores/count'
import { ref, watch } from 'vue'
import { Button } from '../components/shadcn/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/shadcn/ui/card'
import Label from '../components/shadcn/ui/label/Label.vue'
import Slider from '../components/shadcn/ui/slider/Slider.vue'

const countStore = useCountStore()
const offset = ref({ x: 0, y: 0 })

const sliderX = ref<number[]>([offset.value.x])
const sliderY = ref<number[]>([offset.value.y])

watch(sliderX, (v) => {
  offset.value.x = v?.[0] ?? 0
})
watch(sliderY, (v) => {
  offset.value.y = v?.[0] ?? 0
})

watch(
  () => offset.value.x,
  (v) => {
    sliderX.value = [v]
  }
)
watch(
  () => offset.value.y,
  (v) => {
    sliderY.value = [v]
  }
)

async function newWindow(
  position:
    | 'left-top-in'
    | 'left-top-out'
    | 'right-top-in'
    | 'right-top-out'
    | 'left-bottom-in'
    | 'left-bottom-out'
    | 'right-bottom-in'
    | 'right-bottom-out'
    | 'center'
) {
  window.api.send('createWindow', {
    hashRoute: '_demo',
    type: position,
    bound: {
      x: +offset.value.x,
      y: +offset.value.y
    },
    windowConfig: {
      height: 300,
      width: 400
    },
    isFollowMove: true,
    params: {
      data: 'hello'
    }
  })
}
</script>

<template>
  <div class="px-2">
    <Card class="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Create a demo window</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="creator mb-4" @click="countStore.increment">
          Powered by electron-vite {{ countStore.count }}
        </div>
        <div class="grid grid-cols-3 gap-3">
          <Button @click="newWindow('left-top-in')"> left-top-in </Button>
          <Button @click="newWindow('left-top-out')"> left-top-out </Button>
          <Button @click="newWindow('right-top-in')"> right-top-in </Button>
          <Button @click="newWindow('right-top-out')"> right-top-out </Button>
          <Button @click="newWindow('left-bottom-in')"> left-bottom-in </Button>
          <Button @click="newWindow('left-bottom-out')"> left-bottom-out </Button>
          <Button @click="newWindow('right-bottom-in')"> right-bottom-in </Button>
          <Button @click="newWindow('right-bottom-out')"> right-bottom-out </Button>
          <Button @click="newWindow('center')"> center </Button>
        </div>
        <div class="mt-6 space-y-4">
          <div>
            <Label>offset.x: {{ offset.x }}</Label>
            <Slider v-model="sliderX" :min="-1000" :max="1000" :step="1" />
          </div>
          <div>
            <Label>offset.y: {{ offset.y }}</Label>
            <Slider v-model="sliderY" :min="-1000" :max="1000" :step="1" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div class="text-sm text-muted-foreground">Press F12 to open devtools</div>
      </CardFooter>
    </Card>
  </div>
</template>
