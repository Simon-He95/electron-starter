import type { IPCInvokeMap } from '../shared/types.js'
import process from 'node:process'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { tokenDao } from './dexie/index.js'

// Helper: drop the first element of a tuple if present
type InvokeArgs<T extends any[]> = T extends [any, ...infer R] ? R : T
// Resolve args for a channel K
type ArgsFor<K extends keyof IPCInvokeMap> = InvokeArgs<Parameters<IPCInvokeMap[K]>>

// Custom APIs for renderer
export const api = {
  send: <K extends keyof IPCInvokeMap>(
    channel: K,
    ...args: ArgsFor<K>
  ): Promise<Awaited<ReturnType<IPCInvokeMap[K]>>> => {
    return ipcRenderer.invoke(channel as string, ...args) as Promise<
      Awaited<ReturnType<IPCInvokeMap[K]>>
    >
  }
}

// token helper exposed to renderer
export const token = {
  async get() {
    return await tokenDao.getToken()
  },
  async set(value: string) {
    return await tokenDao.setToken(value)
  },
  async remove() {
    return await tokenDao.removeToken()
  }
}

// expose username helpers as well
Object.assign(token, {
  async getUsername() {
    return await tokenDao.getUsername()
  },
  async setUsername(name: string) {
    return await tokenDao.setUsername(name)
  },
  async removeUsername() {
    return await tokenDao.removeUsername()
  }
})

// 导出类型，供声明文件/renderer 引用
export type PreloadAPI = typeof api
//
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('token', token)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
  // @ts-expect-error (define in dts)
  window.token = token
}
