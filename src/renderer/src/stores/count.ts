import { defineStore } from 'pinia'

const channel = new BroadcastChannel('store_channel')

const useStore = defineStore('count', {
  actions: {
    decrement() {
      this.count--
    },
    increment() {
      this.count++
      channel.postMessage({ count: this.count })
    }
  },
  state: () => ({
    count: 0
  })
})

channel.onmessage = (event) => {
  // 更新 Pinia 状态
  useStore().count = event.data.count
}

export default useStore
