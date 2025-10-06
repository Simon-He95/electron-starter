import type { IpcRendererEvent } from 'electron'
import type { InferredIPC } from '../main/listener/index.js'
import type { ArgsForFromImpl, ReturnForFromImpl } from '../shared/ipc.js'
import process from 'node:process'
import { electronAPI } from '@electron-toolkit/preload'
import electron from 'electron'
import { http } from '../main/http/index.js'
import schemaMap, { eventSchemaMap } from '../shared/schemas.js'
import { registerDexie } from './dexie/index.js'

const { contextBridge, ipcRenderer } = electron as any

// Custom APIs for renderer
export const api = {
  getOpenLinksExternal: () => {
    return ipcRenderer.invoke('getOpenLinksExternal')
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    const wrappedListener = (_event: IpcRendererEvent, ...args: any[]) => listener(...args)
    return ipcRenderer.on(channel, wrappedListener)
  },
  send: <K extends keyof InferredIPC>(channel: K, ...args: ArgsForFromImpl<K, InferredIPC>) =>
    invoke(channel, ...args),
  updateOpenLinksExternal: (value: boolean) => {
    return ipcRenderer.invoke('updateOpenLinksExternal', value)
  },
}

// A small typed helper that renderer code can import/use via window.api or window.invoke
export async function invoke<K extends keyof InferredIPC>(
  channel: K,
  ...args: ArgsForFromImpl<K, InferredIPC>
): Promise<Awaited<ReturnForFromImpl<K, InferredIPC>>> {
  try {
    // diagnostic log: show channel (avoid serializing payloads which may contain
    // reactive proxies or cause CSP/eval errors in some environments)
    // eslint-disable-next-line no-console
    console.log(`[preload] invoke -> channel=${String(channel)}`)

    // NOTE: preload runs in a restricted context in some Electron setups where
    // zod's codegen (fast-path) may be blocked. To avoid EvalError crashes in
    // preload, we skip runtime zod parsing here and rely on main-process
    // validation (the main process runs in Node and can perform zod validation
    // safely). Keeping a minimal log so devs know validation is deferred.
    if ((schemaMap as Record<string, any>)[channel as string]) {
      // eslint-disable-next-line no-console
      console.log(`[preload] validation deferred to main for channel=${String(channel)}`)
    }
  }
  catch (e) {
    // zod may attempt to generate fast-path validation functions using new Function()
    // in some restricted/electron preload contexts this throws an EvalError like
    // "Code generation from strings disallowed for this context". In that case
    // skip validation (we'll rely on main process validation) but warn so devs can
    // see what's happening. For other errors, rethrow so callers see validation issues.
    try {
      const err = e as Error
      if (
        err.name === 'EvalError'
        || (err.message && err.message.includes && err.message.includes('Code generation from strings disallowed'))
      ) {
        console.warn('[preload] zod codegen blocked; skipping validation for', String(channel), err)
        // continue without throwing so IPC still happens
      }
      else {
        console.error('invoke validation failed', e)
        throw e
      }
    }
    catch {
      // defensive: if checking the error fails for any reason, rethrow the original
      console.error('invoke validation failed (fatal)', e)
      throw e
    }
  }

  const res = await ipcRenderer.invoke(channel as string, ...args)
  // eslint-disable-next-line no-console
  console.log(`[preload] invoke <- channel=${String(channel)} result=${String(res)}`)
  return res as Promise<Awaited<ReturnForFromImpl<K, InferredIPC>>>
}

export function onTyped(channel: string, listener: (...args: any[]) => void) {
  const schema = (eventSchemaMap as Record<string, any>)[channel]
  const wrapped = (_event: IpcRendererEvent, ...args: any[]) => {
    try {
      if (schema) {
        // assume first arg is the payload
        const [payload] = args as [any]
        schema.parse(payload)
      }
    }
    catch (e) {
      console.error('onTyped validation failed', e)
      // still call listener so apps can handle the error if desired
    }
    return listener(...args)
  }

  return ipcRenderer.on(channel, wrapped)
}

// register dexie and expose token api
registerDexie()

// 导出类型，供声明文件/renderer 引用
export type PreloadAPI = typeof api
export type HttpClient = typeof http
//
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('http', http)
    contextBridge.exposeInMainWorld('invoke', invoke)
    contextBridge.exposeInMainWorld('onIpc', onTyped)
  }
  catch (error) {
    console.error(error)
  }
}
else {
  window.electron = electronAPI
  // Cast to match the shared global Api/HttpClient types declared in src/shared/index.d.ts
  ;(window as any).api = api as any
  ;(window as any).http = http as any
  // expose typed helpers in non-isolated dev mode
  (window as any).invoke = invoke;
  (window as any).onIpc = onTyped
}
