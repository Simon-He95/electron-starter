import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref<{
    type?: 'error' | 'success' | 'warning'
    message?: string
    title?: string
    show: boolean
    duration?: number
  }>({
    show: false
  })
  let timer: any = null

  function show(
    type: 'error' | 'warning' | 'success',
    message: string,
    title: string = '',
    duration: number = 500
  ) {
    alert.value = { duration, message, show: true, title, type }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      alert.value.show = false
      timer = null
    }, duration)
  }

  function close() {
    alert.value = {
      show: false
    }
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { alert, close, show }
})
