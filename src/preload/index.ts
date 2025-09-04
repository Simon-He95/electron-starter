import type { IPCInvokeMap } from '../shared/types.js'
import process from 'node:process'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { registerDexie } from './dexie/index.js'

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
// register dexie and expose token api
registerDexie()

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
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
