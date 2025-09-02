import type { WindowOptions } from '../main/listener/createWindow.js'

export type CreateWindowOpts = WindowOptions

/**
 * 描述 renderer / preload 可调用的 IPC 映射（不要包含 IpcMainInvokeEvent）
 */
export interface IPCInvokeMap {
  ping: () => void
  createWindow: (opts: CreateWindowOpts) => void
}

export type { IPCInvokeMap as default }
