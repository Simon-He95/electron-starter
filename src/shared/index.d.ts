/// <reference types="vite/client" />

import type { BrowserWindowConstructorOptions, IpcMainInvokeEvent } from 'electron'

export interface WindowOptions {
  windowConfig: Omit<BrowserWindowConstructorOptions, 'webPreferences' | 'x' | 'y'> & {
    animate?:
      | {
          offsetX: number
          offsetY: number
          duration?: number
        }
      | boolean
  }
  params?: Record<string, any>
  type?:
    | 'left-top-in'
    | 'left-top-out'
    | 'right-top-in'
    | 'right-top-out'
    | 'left-bottom-in'
    | 'left-bottom-out'
    | 'right-bottom-in'
    | 'right-bottom-out'
    | 'center'
  bound?: Partial<Electron.Rectangle>
  hashRoute?: string
  id?: string
  isFollowMove?: boolean // 是否跟随父窗口移动
  /**
   * 当渲染层中的链接被点击或尝试打开新窗口时，
   * 指示是否在外部浏览器中打开（true）或在应用内打开（false）。
   * 默认为 true（保持现有行为：外部打开）。
   */
  openLinksExternal?: boolean
  exportName?: string // 窗口的全局变量名称，默认不设置
}

export type CreateWindowOpts = WindowOptions

/**
 * 描述 renderer / preload 可调用的 IPC 映射（不要包含 IpcMainInvokeEvent）
 */
export interface IPCInvokeMap {
  ping: (event: IpcMainInvokeEvent, ...args: any[]) => void
  createWindow: (event: IpcMainInvokeEvent, opts: CreateWindowOpts) => number
  updateWindowBounds: (
    event: IpcMainInvokeEvent,
    options: { id: string; bounds: { width?: number; height?: number } }
  ) => boolean
  updateOpenLinksExternal: (event: IpcMainInvokeEvent, value: boolean) => void
  getOpenLinksExternal: (event: IpcMainInvokeEvent) => boolean
}

// Helper: drop the first element of a tuple if present
export type InvokeArgs<T extends any[]> = T extends [any, ...infer R] ? R : T
// Resolve args for a channel K
export type ArgsFor<K extends keyof IPCInvokeMap> = InvokeArgs<Parameters<IPCInvokeMap[K]>>

export interface Api {
  on: (channel: string, listener: (...args: any[]) => void) => Electron.IpcRenderer | void
  send: <K extends keyof IPCInvokeMap>(
    channel: K,
    ...args: ArgsFor<K>
  ) => Promise<Awaited<ReturnType<IPCInvokeMap[K]>>>
  updateOpenLinksExternal: (value: boolean) => Promise<void>
  getOpenLinksExternal: () => Promise<boolean>
}

type Params = Record<string, any>
type RequestConfig = Record<string, any>

export interface HttpClient {
  get: <T = any>(url: string, params?: Params, config?: RequestConfig) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>
  delete: <T = any>(url: string, params?: Params, config?: RequestConfig) => Promise<T>
}

declare global {
  interface Window {
    // Custom API exposed from preload
    electron: typeof import('@electron-toolkit/preload').electronAPI
    api: Api
    http: HttpClient
  }
}

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
