<script setup lang="ts">
import useCountStore from '@stores/count'
import { Button } from '../components/shadcn/ui/button'

const countStore = useCountStore()
</script>

<template>
  <div class="prose max-w-2xl mx-auto mt-12 p-6">
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
    </div>
  </div>
</template>
