import type { BrowserWindow as ElectronBrowserWindow } from 'electron'
import process from 'node:process'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import electron from 'electron'
import schemaMap from '../shared/schemas.js'
import { createWindow, destroyAllTrackedWindows } from './listener/createWindow.js'
import { ipcListener } from './listener/index.js'

const { app, BrowserWindow, ipcMain } = electron as any

export const context = {
  windows: {
    map: new Map<string, ElectronBrowserWindow>(),
    openLinksExternal: true,
  },
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test

  const mainWindow = createWindow({
    hashRoute: 'login',
    windowConfig: {
      animate: false,
    },
  })
  context.windows.map.set('main', mainWindow)

  // ensure we run our cleanup as soon as the main window is closed
  try {
    mainWindow.on('closed', () => {
      try {
        destroyAllTrackedWindows()
      }
      catch (err) {
        console.error('error during main closed cleanup', err)
      }
    })
  }
  catch {
    // if mainWindow is not a BrowserWindow for some reason, ignore
  }

  Object.keys(ipcListener).forEach((key) => {
    // 每个 listener 的实现期望的是 (...args) 而不是 (event, ...args)
    // eslint-disable-next-line no-console
    console.log(`[main] register handler: ${key}`)
    ipcMain.handle(key, (...args) => {
      // eslint-disable-next-line no-console
      console.log(`[main] invoke handler: ${key}`)
      try {
        // if we have a schema for this channel, validate the first argument
        try {
          const schema = (schemaMap as Record<string, any>)[key]
          if (schema) {
            const [, payload] = args as [any, any]
            // z.undefined() schemas should only accept undefined
            const isUndefinedSchema = schema === undefined || schema._def?.typeName === 'ZodUndefined'
            if (isUndefinedSchema) {
              if (typeof payload !== 'undefined') {
                throw new TypeError(`channel ${String(key)} expects no payload`)
              }
            }
            else {
              schema.parse(payload)
            }
          }
        }
        catch (validationError) {
          console.error(`[main] validation failed for ${key}`, validationError)
          throw validationError
        }

        return (ipcListener as any)[key](...args)
      }
      catch (e) {
        console.error(`[main] handler ${key} threw`, e)
        throw e
      }
    })
  })

  // Dev-time checks: warn if we have handlers without schemas or schemas without handlers
  if (process.env.NODE_ENV !== 'production') {
    const handlerKeys = Object.keys(ipcListener)
    const schemaKeys = Object.keys(schemaMap)

    const handlersWithoutSchema = handlerKeys.filter(k => !schemaKeys.includes(k))
    const schemasWithoutHandler = schemaKeys.filter(k => !handlerKeys.includes(k))

    if (handlersWithoutSchema.length > 0) {
      console.warn('[main] IPC handlers without schema:', handlersWithoutSchema)
    }
    if (schemasWithoutHandler.length > 0) {
      console.warn('[main] IPC schemas without handler implementation:', schemasWithoutHandler)
    }
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // ensure we clean up tracked windows and internal maps before quitting
    try {
      destroyAllTrackedWindows()
    }
    catch (err) {
      console.error('error during global window cleanup', err)
    }
    app.quit()
  }
})

// also run cleanup right before the app quits (best-effort)
app.on('before-quit', () => {
  try {
    destroyAllTrackedWindows()
  }
  catch (err) {
    console.error('error during before-quit cleanup', err)
  }
})
