<script setup lang="ts">
import { Button } from '@renderer/components/shadcn/ui/button'

const props = defineProps<{
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  __closeTooltip?: () => void
}>()

function close() {
  props.__closeTooltip?.()
}
</script>

<template>
  <div class="space-y-2">
    <div class="text-sm font-medium">
      {{ title }}
    </div>
    <div v-if="description" class="text-xs text-muted-foreground">
      {{ description }}
    </div>
    <div class="flex items-center justify-end gap-2 pt-1">
      <Button size="sm" variant="ghost" @click="close">
        {{ cancelText ?? '取消' }}
      </Button>
      <Button size="sm" @click="close">
        {{ confirmText ?? '确认' }}
      </Button>
    </div>
  </div>
</template>

