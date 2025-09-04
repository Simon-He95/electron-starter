<script setup lang="ts">
import { Button } from '@shadcn/button'
import { useAuthStore } from '@stores/auth'
import useCountStore from '@stores/count'
import { ref } from 'vue'

const countStore = useCountStore()
const offset = ref({
  x: 0,
  y: 0,
})
const auth = useAuthStore()
function logout() {
  auth.setToken(null)
  auth.setUsername(null)
}
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
    | 'center',
) {
  window.api.send('createWindow', {
    hashRoute: '_demo',
    type: position,
    bound: {
      x: +offset.value.x,
      y: +offset.value.y,
    },
    windowConfig: {
      height: 300,
      width: 400,
    },
    params: {
      data: 'hello',
    },
  })
}
</script>

<template>
  <div class="flex justify-end p-4">
    <div v-if="auth.username" class="flex items-center gap-3">
      <span class="text-sm">{{ auth.username }}</span>
      <Button variants="destructive" @click="logout">
        Logout
      </Button>
    </div>
  </div>
  <img alt="logo" class="logo" src="../assets/electron.svg">
  <div class="creator" @click="countStore.increment">
    Powered by electron-vite {{ countStore.count }}
  </div>
  <div class="text">
    Build an Electron app with <span class="vue">Vue</span> and <span class="ts">TypeScript</span>
  </div>
  <p class="tip">
    Please try pressing <code>F12</code> to open the devTool
  </p>
  <div class="grid-cols-3 grid grid-flow-row">
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('left-top-in')">new Window on left-top-in</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('left-top-out')">new Window on left-top-out</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('right-top-in')">new Window on right-top-in</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('right-top-out')">new Window on right-top-out</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('left-bottom-in')">new Window on left-bottom-in</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('left-bottom-out')">new Window on left-bottom-out</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('right-bottom-in')">new Window on right-bottom-in</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('right-bottom-out')">new Window on right-bottom-out</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow('center')">new Window on center</a>
    </div>
  </div>
  <div>
    <div class="mt-4 space-y-2">
      <div class="flex items-center gap-2">
        <label class="w-16">offset.x</label>
        <input v-model="offset.x" type="range" min="-1000" max="1000" step="1">
        <div class="ml-4">
          {{ offset.x }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <label class="w-16">offset.y</label>
        <input v-model="offset.y" type="range" min="-1000" max="1000" step="1">
        <div class="ml-4">
          {{ offset.y }}
        </div>
      </div>
    </div>
  </div>
</template>
