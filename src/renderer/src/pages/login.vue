<script setup lang="ts">
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shadcn/form'
import { Input } from '@shadcn/input'
import { useAuthStore } from '@stores/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm /* Field */ } from 'vee-validate'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as z from 'zod'
import { Button } from '../components/shadcn/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/shadcn/ui/card'

const router = useRouter()
const auth = useAuthStore()
const usernameRef = ref<{ focus?: () => void, el?: HTMLInputElement | null } | null>(null)
const loading = ref(false)

onMounted(() => {
  // if token already present after auth.init(), redirect away from login
  if (auth.token) {
    router.replace({ path: '/' })
  }
  else {
    usernameRef.value?.focus?.()
  }
})

// fake login function that returns a token after a small delay; only username required
async function fakeLogin(user: string) {
  await new Promise(r => setTimeout(r, 300))
  if (user)
    return `token-${btoa(user)}`
  throw new Error('Invalid username')
}
// Vee-validate + zod schema
const formSchema = toTypedSchema(
  z.object({
    username: z
      .string()
      .min(1, 'Please enter a username')
      .regex(/^\S+$/, 'Username cannot contain spaces'),
  }),
)

const { handleSubmit, values, resetForm, meta } = useForm({ validationSchema: formSchema })

const onSubmit = handleSubmit(async (vals) => {
  loading.value = true
  try {
    const t = await fakeLogin(vals.username)
    await auth.setToken(t)
    await auth.setUsername(vals.username)
    await router.replace({ path: '/' })
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
  finally {
    loading.value = false
  }
})

function reset() {
  resetForm({ values: { username: '' } })
  nextTick(() => usernameRef.value?.focus?.())
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <Card class="w-[400px]">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter any username to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit">
          <div class="grid w-full gap-4">
            <FormField v-slot="{ componentField }" name="username">
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    id="username"
                    ref="usernameRef"
                    placeholder="Your username"
                    aria-required="true"
                  />
                </FormControl>
                <div class="min-h-[1.25rem] overflow-hidden transition-all duration-150">
                  <FormMessage />
                </div>
              </FormItem>
            </FormField>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex items-center justify-between px-6 pb-6">
        <Button variant="outline" @click="reset">
          Cancel
        </Button>
        <Button
          :disabled="loading || !values.username || !meta.valid"
          class="ml-2"
          @click="onSubmit"
        >
          {{ loading ? 'Signing in...' : 'Continue' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
