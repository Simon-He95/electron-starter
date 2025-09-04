import process from 'node:process'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createWindow } from './listener/createWindow.js'
import { ipcListener } from './listener/index.js'

export const context: any = {}
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
    windowConfig: {
      animate: false
    },
    hashRoute: 'login'
  })
  context.mainWindow = mainWindow

  Object.keys(ipcListener).forEach((key) => {
    // 每个 listener 的实现期望的是 (...args) 而不是 (event, ...args)
    ipcMain.handle(key, (...args) => (ipcListener as any)[key](...args))
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
