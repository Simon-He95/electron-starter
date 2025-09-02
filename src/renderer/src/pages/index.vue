<script setup lang="ts">
import useCountStore from '@stores/count'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const countStore = useCountStore()

async function newWindow() {
  window.api.send('createWindow', {
    bound: {
      x: -200,
      y: 0,
    },
    hashRoute: '_demo',
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
  <img alt="logo" class="logo" src="../assets/electron.svg">
  <div class="creator" @click="countStore.increment">
    Powered by electron-vite {{ countStore.count }}
  </div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
    and
    <span class="ts">TypeScript</span>
  </div>
  <p class="tip">
    Please try pressing <code>F12</code> to open the devTool
  </p>
  <div class="actions">
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="newWindow">new Window</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
  </div>
</template>
