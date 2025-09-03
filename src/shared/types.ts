import type { BrowserWindowConstructorOptions, IpcMainInvokeEvent } from 'electron'

export interface WindowOptions {
  windowConfig: Omit<BrowserWindowConstructorOptions, 'webPreferences' | 'x' | 'y'>
  params?: Record<string, any>
  type?: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' | 'center'
  bound?: Partial<Electron.Rectangle>
  hashRoute?: string
}

export type CreateWindowOpts = WindowOptions

/**
 * 描述 renderer / preload 可调用的 IPC 映射（不要包含 IpcMainInvokeEvent）
 */
export interface IPCInvokeMap {
  ping: (event: IpcMainInvokeEvent, ...args: any[]) => void
  createWindow: (event: IpcMainInvokeEvent, opts: CreateWindowOpts) => void
}
