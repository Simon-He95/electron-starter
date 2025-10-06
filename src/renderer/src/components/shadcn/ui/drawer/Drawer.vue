<script lang="ts" setup>
import type { DrawerRootEmits, DrawerRootProps } from 'vaul-vue'
import { useForwardPropsEmits } from 'reka-ui'
import { DrawerRoot } from 'vaul-vue'

const props = withDefaults(defineProps<DrawerRootProps>(), {
  shouldScaleBackground: true,
})

const emits = defineEmits<DrawerRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
// ensure forwarded is treated as an object for template v-bind spreads
const forwardedProps = forwarded as unknown as Record<string, unknown>
</script>

<template>
  <DrawerRoot v-bind="forwardedProps">
    <slot />
  </DrawerRoot>
</template>
