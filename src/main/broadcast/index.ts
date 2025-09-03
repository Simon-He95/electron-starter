import { ipcMain } from 'electron'

const proxy = new Map<string, Promise<any>>()

export function on(
  channel: string,
  listener: (event: Electron.IpcMainEvent, ...args: any[]) => unknown
) {
  if (proxy.has(channel)) {
    throw new Error(`Channel ${channel} is already registered`)
  }

  const p = new Promise((resolve, reject) => {
    ipcMain.on(channel, async (event, ...args) => {
      try {
        const result = await listener(event, ...args)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  })

  proxy.set(channel, p)
  ipcMain.emit('proxy-update', proxy)
  return p
}
