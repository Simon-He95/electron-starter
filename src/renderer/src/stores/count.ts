import { defineStore } from 'pinia'
import { v4 } from 'uuid'

const channel = new BroadcastChannel('store_channel')

// unique id for this renderer instance so we can ignore our own requests
const instanceId = v4()

const useStore = defineStore('count', {
  actions: {
    decrement() {
      this.count--
    },
    increment() {
      this.count++
      // broadcast the new value to other windows
      channel.postMessage({ $$sourceId: instanceId, $$type: 'update', count: this.count })
    },
  },
  state: () => ({
    count: 0,
  }),
})

channel.onmessage = (event) => {
  const data = event.data

  if (!data)
    return

  // handle update broadcasts from other windows
  if (data.$$type === 'update') {
    useStore().count = data.count
    return
  }

  // if a new window asks for the current state, reply with an update
  if (data.$$type === 'request') {
    // only reply if the requester is not this instance
    if (data.$$requesterId && data.$$requesterId !== instanceId) {
      channel.postMessage({ $$sourceId: instanceId, $$type: 'update', count: useStore().count })
    }
  }
}

channel.postMessage({ $$requesterId: instanceId, $$type: 'request' })

export default useStore
