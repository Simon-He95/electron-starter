import type { BrowserWindowConstructorOptions, IpcMainInvokeEvent } from 'electron'
import type { SchemaInputs } from './schemas.js'

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
  isFollowMove?: boolean
  openLinksExternal?: boolean
  exportName?: string
}

export type CreateWindowOpts = WindowOptions

export interface IPCInvokeMap {
  ping: (event: IpcMainInvokeEvent, ...args: any[]) => void
  // Use the schema-inferred input types so IPC types stay in sync with runtime schemas.
  createWindow: (event: IpcMainInvokeEvent, opts: SchemaInputs['createWindow']) => number
  updateWindowBounds: (event: IpcMainInvokeEvent, options: SchemaInputs['updateWindowBounds']) => boolean
  updateOpenLinksExternal: (event: IpcMainInvokeEvent, value: SchemaInputs['updateOpenLinksExternal']) => void
  // This channel returns a boolean indicating whether links open externally
  getOpenLinksExternal: (event: IpcMainInvokeEvent) => boolean
}

export type InvokeArgs<T extends any[]> = T extends [any, ...infer R] ? R : T
export type ArgsFor<K extends keyof IPCInvokeMap> = InvokeArgs<Parameters<IPCInvokeMap[K]>>

// Helper to let main define handlers and keep their types available for import
/**
 * Define IPC handlers in the main process.
 *
 * Constraining to Partial<IPCInvokeMap> ensures implementations follow the
 * schema-derived handler shapes (first param is the IpcMainInvokeEvent) while
 * allowing handlers to implement a subset of channels.
 */
export function defineIpcHandlers<T extends Record<string, (...args: any[]) => any>>(handlers: T) {
  return handlers as T
}

/**
 * Opt-in stricter handler definer.
 *
 * Use this when you want TypeScript to enforce that the handlers you implement
 * conform to the schema-derived `IPCInvokeMap`. It accepts a Partial so you
 * can still implement a subset of channels. This function is intentionally
 * separate so existing code that uses `defineIpcHandlers` remains compatible.
 */
export function defineIpcHandlersStrict<T extends Partial<IPCInvokeMap>>(handlers: T) {
  return handlers as T
}

// Convenience type for the channel names supported by the app
export type IpcChannel = keyof IPCInvokeMap

// Strip the first event parameter (IpcMainInvokeEvent) from a function type
export type StripFirstArg<F> = F extends (event: any, ...rest: infer R) => infer RT ? (...args: R) => RT : F

// Derive Args (without the first event) for a given key K in a handler map M
export type ArgsForFromImpl<K extends keyof any, M> = K extends keyof M
  ? M[K] extends (...args: infer A) => any
    ? A extends [any, ...infer R]
      ? R
      : A
    : never
  : never

export type ReturnForFromImpl<K extends keyof any, M> = K extends keyof M
  ? M[K] extends (...args: any[]) => infer R
    ? R
    : never
  : never

export interface Api {
  on: (channel: string, listener: (...args: any[]) => void) => Electron.IpcRenderer | void
  send: <K extends keyof IPCInvokeMap>(channel: K, ...args: ArgsFor<K>) => Promise<Awaited<ReturnType<IPCInvokeMap[K]>>>
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

export interface TokenApi {
  get: () => Promise<string | null>
  set: (value: string) => Promise<void>
  remove: () => Promise<void>
  getUsername: () => Promise<string | null>
  setUsername: (name: string) => Promise<void>
  removeUsername: () => Promise<void>
}
