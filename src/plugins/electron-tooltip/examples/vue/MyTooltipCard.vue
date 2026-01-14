<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <div style="display:flex;gap:8px;align-items:flex-start">
    <div style="width:8px;height:8px;border-radius:999px;background:#111;opacity:.7;margin-top:4px" />
    <div>
      <div style="font-weight:600;font-size:12px;line-height:1.2">{{ title }}</div>
      <div v-if="description" style="margin-top:4px;font-size:11px;opacity:.7;line-height:1.2">
        {{ description }}
      </div>
    </div>
  </div>
</template>

