<script setup lang="ts">
import useCountStore from '@stores/count'
import { useRoute } from 'vue-router'

const countStore = useCountStore()
const route = useRoute()
</script>

<template>
  <img alt="logo" class="logo" src="../assets/electron.svg">
  <div class="creator" @click="countStore.increment">
    我是 demo {{ countStore.count }}
    {{ route.query.data }}
  </div>
</template>
