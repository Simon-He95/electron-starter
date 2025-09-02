import { createPinia } from 'pinia'

import routes from 'virtual:generated-pages'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

import './assets/main.css'

const pinia = createPinia()

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

const app = createApp(App)
app.use(router).use(pinia).mount('#app')
