import { useAuthStore } from '@stores/auth'

import { createPinia, setActivePinia } from 'pinia'
// @ts-expect-error -- IGNORE --
import routes from 'virtual:generated-pages'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

import './styles/index.css'

const pinia = createPinia()

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

;(async () => {
  // ensure pinia is active for stores before using them
  setActivePinia(pinia)

  const app = createApp(App)
  app.use(router).use(pinia)

  // initialize auth store to load token from Dexie (preload) before mount
  const auth = useAuthStore()
  await auth.init()

  // If user navigates to /login but already has token, redirect to '/'
  router.beforeEach((to) => {
    if (to.path === '/login' && auth.token) return { path: '/' }
    return true
  })

  app.mount('#app')
})()
