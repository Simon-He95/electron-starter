// Typed global declarations for the preload helpers exposed to renderer
// This file lets renderer code call `window.invoke(...)`, `window.onIpc(...)`, and access `window.token` with correct types.

import type { InferredIPC } from '../main/listener'
import type { PreloadAPI } from '../preload'
import type { HttpClient, TokenApi } from '../shared/ipc'
import type { MainArgs, MainReturn } from './ipc-types'

declare global {
  // typed helper available on window in non-isolated dev or via contextBridge in production
  function invoke<K extends keyof InferredIPC>(channel: K, ...args: MainArgs<K>): Promise<MainReturn<K>>

  function onIpc(channel: string, listener: (...args: any[]) => void): Electron.IpcRenderer

  // token helper
  const token: TokenApi

  // exposed namespaces
  const api: PreloadAPI
  const http: HttpClient

  interface Window {
    invoke: typeof invoke
    onIpc: typeof onIpc
    token: TokenApi
    api: PreloadAPI
    http: HttpClient
  }
}

export {}
