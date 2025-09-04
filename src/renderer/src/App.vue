<script setup lang="ts">
import AppSidebar from '@renderer/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@shadcn/sidebar'
import { useRoute } from 'vue-router'

const route = useRoute()
const showSiderBarRoutes = ['/']
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
