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
}

export type CreateWindowOpts = WindowOptions

/**
 * 描述 renderer / preload 可调用的 IPC 映射（不要包含 IpcMainInvokeEvent）
 */
export interface IPCInvokeMap {
  ping: (event: IpcMainInvokeEvent, ...args: any[]) => void
  createWindow: (event: IpcMainInvokeEvent, opts: CreateWindowOpts) => void
}
