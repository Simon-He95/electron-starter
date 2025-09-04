import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const loading = ref(false)
  const username = ref<string | null>(null)

  async function setToken(t: string | null) {
    token.value = t
    try {
      if (t) {
        // store token via preload/token
        // @ts-expect-error token is injected by preload
        await window.token.set(t)
      }
      else {
        // @ts-expect-error token is injected by preload
        await window.token.remove()
      }
    }
    catch (e) {
      console.error('token storage failed', e)
    }
  }

  async function setUsername(name: string | null) {
    username.value = name
    try {
      if (name) {
        // @ts-expect-error token is injected by preload
        await window.token.setUsername(name)
      }
      else {
        // @ts-expect-error token is injected by preload
        await window.token.removeUsername()
      }
    }
    catch (e) {
      console.error('username storage failed', e)
    }
  }

  async function init() {
    loading.value = true
    try {
      // @ts-expect-error token is injected by preload
      const t = await window.token.get()
      if (t)
        token.value = t
      // @ts-expect-error token is injected by preload
      const u = await window.token.getUsername()
      if (u)
        username.value = u
    }
    catch (e) {
      console.error('failed to read token', e)
    }
    finally {
      loading.value = false
    }
  }

  return { init, loading, setToken, setUsername, token, username }
})
