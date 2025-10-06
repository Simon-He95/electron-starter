/// <reference types="vite/client" />

import type { Api, ArgsFor, CreateWindowOpts, HttpClient, InvokeArgs, IPCInvokeMap, TokenApi } from './ipc.js'

// Re-export types that other modules import from the old path `shared/index.js`
export type { Api, ArgsFor, CreateWindowOpts, HttpClient, InvokeArgs, IPCInvokeMap, TokenApi }

declare global {
  interface Window {
    electron: typeof import('@electron-toolkit/preload').electronAPI
    api: Api
    http: HttpClient
    token: TokenApi
    // typed invoke helper exposed by preload
    invoke: <K extends keyof IPCInvokeMap>(channel: K, ...args: ArgsFor<K>) => Promise<Awaited<ReturnType<IPCInvokeMap[K]>>>
    // generic IPC on helper
    onIpc: (channel: string, listener: (...args: any[]) => void) => Electron.IpcRenderer | void
  }
}

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}

// Vite-style asset query imports used in the project (e.g. 'icon.png?asset')
declare module '*?asset' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.png?asset' {
  const src: string
  export default src
}
