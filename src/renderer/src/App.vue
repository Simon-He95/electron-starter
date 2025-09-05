<script setup lang="ts">
import AppSidebar from '@renderer/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@shadcn/sidebar'
import { useRoute } from 'vue-router'

const route = useRoute()
const showSiderBarRoutes = ['/']
window.api.on('window-blur', (...args) => {
  // eslint-disable-next-line no-console
  console.log('window-blur', args)
})
</script>

<template>
  <SidebarProvider v-if="showSiderBarRoutes.includes(route.path)">
    <AppSidebar />
    <main class="w-full h-full">
      <SidebarTrigger />
      <RouterView />
    </main>
  </SidebarProvider>
  <RouterView v-else />
</template>
