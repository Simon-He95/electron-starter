import type { IPCInvokeMap } from '../shared/types.js'
import process from 'node:process'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { http } from '../main/http/index.js'
import { registerDexie } from './dexie/index.js'

// Helper: drop the first element of a tuple if present
type InvokeArgs<T extends any[]> = T extends [any, ...infer R] ? R : T
// Resolve args for a channel K
type ArgsFor<K extends keyof IPCInvokeMap> = InvokeArgs<Parameters<IPCInvokeMap[K]>>

// Custom APIs for renderer
export const api: {
  on: (channel: string, listener: (...args: any[]) => void) => Electron.IpcRenderer | void
  send: <K extends keyof IPCInvokeMap>(
    channel: K,
    ...args: ArgsFor<K>
  ) => Promise<Awaited<ReturnType<IPCInvokeMap[K]>>>
} = {
  on: (channel: string, listener: (...args: any[]) => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, ...args: any[]) => listener(...args)
    return ipcRenderer.on(channel, wrappedListener)
  },
  send: <K extends keyof IPCInvokeMap>(
    channel: K,
    ...args: ArgsFor<K>
  ): Promise<Awaited<ReturnType<IPCInvokeMap[K]>>> => {
    return ipcRenderer.invoke(channel as string, ...args) as Promise<
      Awaited<ReturnType<IPCInvokeMap[K]>>
    >
  }
}

// register dexie and expose token api
registerDexie()

// 导出类型，供声明文件/renderer 引用
export type PreloadAPI = typeof api
export type HttpClient = typeof http
//
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('http', http)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
  // @ts-expect-error (define in dts)
  window.http = http
}
