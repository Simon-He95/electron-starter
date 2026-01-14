<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex items-start gap-3">
    <div class="mt-0.5 h-2 w-2 rounded-full bg-primary/80" />
    <div class="min-w-0">
      <div class="text-sm font-medium leading-tight">
        {{ title }}嘿嘿
      </div>
      <div v-if="description" class="mt-1 text-xs text-muted-foreground leading-snug">
        {{ description }}
      </div>
    </div>
  </div>
</template>

