<script setup lang="ts">
import AppSidebar from '@renderer/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@shadcn/sidebar'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <SidebarProvider v-if="route.path !== '/login'">
    <AppSidebar />
    <main class="w-full h-full">
      <SidebarTrigger />
      <RouterView />
    </main>
  </SidebarProvider>
  <RouterView v-else />
</template>
