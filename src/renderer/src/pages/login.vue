<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  // if token already present after auth.init(), redirect away from login
  if (auth.token) {
    router.replace({ path: '/' })
  }
})

// fake login function that returns a token after a small delay; only username required
async function fakeLogin(user: string) {
  await new Promise((r) => setTimeout(r, 300))
  if (user) return `token-${btoa(user)}`
  throw new Error('Invalid username')
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const t = await fakeLogin(username.value)
    await auth.setToken(t)
    await auth.setUsername(username.value)
    await router.replace({ path: '/' })
  } catch (e: any) {
    error.value = e?.message ?? 'login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md mt-20 p-6 border rounded">
    <h2 class="text-xl mb-4">Login</h2>
    <div class="space-y-3">
      <div>
        <label class="block">Username</label>
        <input v-model="username" class="w-full border p-2 text-black" />
      </div>
      <div>
        <button @click="submit" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded">
          {{ loading ? 'Logging...' : 'Login' }}
        </button>
      </div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
    </div>
  </div>
</template>
