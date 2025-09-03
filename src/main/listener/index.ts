import type { IPCInvokeMap } from '../../shared/ipc.js'
import type { WindowOptions } from './createWindow.js'
import { context } from '../index.js'
import { createWindow } from './createWindow.js'

// ipcListener 的 handler 签名不包含 IpcMainInvokeEvent，方便在 preload/renderer 使用
const ipcListener = {
  createWindow: (_event, params: WindowOptions) => {
    createWindow(
      Object.assign(
        {
          parent: context.mainWindow
        },
        params
      )
    )
  },
  ping: () => {
    // eslint-disable-next-line no-console
    console.log('pong')
  }
} satisfies {
  [K in keyof IPCInvokeMap]: (
    ...args: Parameters<IPCInvokeMap[K]>
  ) => ReturnType<IPCInvokeMap[K]> | Promise<ReturnType<IPCInvokeMap[K]>>
}

export { ipcListener }
