<script setup lang="ts">
import type { NavigationMenuListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@utils/index'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuList, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuList
    v-bind="forwardedProps"
    :class="cn('group flex flex-1 list-none items-center justify-center gap-x-1', props.class)"
  >
    <slot />
  </NavigationMenuList>
</template>
