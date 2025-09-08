import type { IPCInvokeMap, WindowOptions } from '../../shared/index.js'
import { context } from '../index.js'
import { createWindow, updateWindowBounds } from './createWindow.js'

// ipcListener 的 handler 签名不包含 IpcMainInvokeEvent，方便在 preload/renderer 使用
const ipcListener = {
  createWindow: (_event, params: WindowOptions) => {
    const win = createWindow(
      Object.assign(
        {
          parent: context.windows.map.get('main')
        },
        params
      )
    )
    return win.id
  },
  getOpenLinksExternal: () => {
    return context.windows.openLinksExternal
  },
  ping: () => {
    // eslint-disable-next-line no-console
    console.log('pong')
  },
  updateOpenLinksExternal: (_event, value: boolean) => {
    context.windows.openLinksExternal = value
  },
  updateWindowBounds: (
    _event,
    options: { id: string; bounds: { width?: number; height?: number } }
  ) => {
    return updateWindowBounds(options)
  }
} satisfies {
  [K in keyof IPCInvokeMap]: (
    ...args: Parameters<IPCInvokeMap[K]>
  ) => ReturnType<IPCInvokeMap[K]> | Promise<ReturnType<IPCInvokeMap[K]>>
}

export { ipcListener }
