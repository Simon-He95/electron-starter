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
        await window.token.set(t)
      }
      else {
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
        await window.token.setUsername(name)
      }
      else {
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
      const t = await window.token.get()
      if (t)
        token.value = t
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
