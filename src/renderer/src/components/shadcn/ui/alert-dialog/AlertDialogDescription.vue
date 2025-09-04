<script setup lang="ts">
import type { AlertDialogDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@utils/index'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogDescription } from 'reka-ui'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AlertDialogDescription
    v-bind="delegatedProps"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
