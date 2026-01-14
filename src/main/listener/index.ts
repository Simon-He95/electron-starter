import type { ArgsForFromImpl, ReturnForFromImpl, CreateWindowOpts as WindowOptions } from '../../shared/ipc.js'
import type { SchemaInputs } from '../../shared/schemas.js'
import { defineIpcHandlersStrict } from '../../shared/ipc.js'
import { context } from '../index.js'

import { createWindow, updateWindowBounds } from './createWindow.js'
import { tooltipManager } from '../tooltip/TooltipManager.js'
import { createElectronTooltipIpcHandlers } from '../../plugins/electron-tooltip/main/createIpcHandlers.js'

// ipcListener 的 handler 签名保留 event 参数（IpcMainInvokeEvent），但我们使用 defineIpcHandlers
// 以便 TypeScript 从实现处推断出类型并将其可供其他模块 import
const ipcListener = defineIpcHandlersStrict({
  createWindow: (_event, params: SchemaInputs['createWindow']) => {
    // eslint-disable-next-line no-console
    console.log('[main:listener] createWindow handler called', { id: params.id, type: params.type })
    const win = createWindow(
      // params comes from SchemaInputs and is a loose object; cast to WindowOptions for the createWindow API
      Object.assign({ parent: context.windows.map.get('main') }, params) as WindowOptions,
    )
    // eslint-disable-next-line no-console
    console.log('[main:listener] createWindow created id=', win.id)
    return win.id
  },
  getOpenLinksExternal: (_event) => {
    return context.windows.openLinksExternal
  },
  ...createElectronTooltipIpcHandlers(tooltipManager),
  ping: () => {
    // eslint-disable-next-line no-console
    console.log('pong')
  },
  updateOpenLinksExternal: (_event, value: SchemaInputs['updateOpenLinksExternal']) => {
    context.windows.openLinksExternal = value
  },
  updateWindowBounds: (_event, options: SchemaInputs['updateWindowBounds']) => {
    return updateWindowBounds(options)
  },
})

// 导出实现（runtime）和类型（dev-time）
export type InferredIPC = typeof ipcListener
export type IPCInvokeMapImpl = {
  [K in keyof InferredIPC]: InferredIPC[K]
}

export { ipcListener }

export type MainArgs<K extends keyof InferredIPC> = ArgsForFromImpl<K, InferredIPC>
export type MainReturn<K extends keyof InferredIPC> = ReturnForFromImpl<K, InferredIPC>

// Convenience: extract the first (most common) argument type for a channel

export type ImplArg<K extends keyof InferredIPC> = MainArgs<K> extends [infer P] ? P : MainArgs<K>[number]

export type MainArg<K extends keyof InferredIPC> = ImplArg<K> & (K extends keyof SchemaInputs ? SchemaInputs[K] : unknown)
