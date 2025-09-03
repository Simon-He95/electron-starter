import type { BrowserWindowConstructorOptions } from 'electron'
import { join } from 'node:path'
import process from 'node:process'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import icon from '../../../resources/icon.png?asset'
import { context } from '../index.js'

export interface WindowOptions {
  windowConfig: Omit<BrowserWindowConstructorOptions, 'webPreferences' | 'x' | 'y'>
  params?: Record<string, any>
  type?: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' | 'center'
  bound?: Partial<Electron.Rectangle>
  hashRoute?: string
}
export function createWindow(options: WindowOptions = { windowConfig: {} }) {
  // Create the browser window.
  // 当设置了 bound 时，parent 不应该生效，因为有 parent 的话，window 会出现在 parent 的中央
  const windowConfig = Object.assign(
    {
      alwaysOnTop: true,
      autoHideMenuBar: true,
      closable: true,
      height: 670,
      show: false,
      width: 900,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    },
    options.windowConfig,
    {
      modal:
        (options.windowConfig?.modal ?? options.bound?.x) ? false : !!options.windowConfig?.parent,
      parent: options.bound?.x ? undefined : options.windowConfig?.parent
    }
  )
  const mainWindow = new BrowserWindow(windowConfig)

  mainWindow.on('ready-to-show', () => {
    if (options.bound) {
      // 如果有 parent，则相对于 parent 定位
      const parentBounds =
        options.windowConfig?.parent?.getBounds() ||
        BrowserWindow.getFocusedWindow()?.getBounds() ||
        context.mainWindow?.getBounds()
      if (!parentBounds) {
        return
      }

      let x, y
      if (!options.type || options.type === 'center') {
        x =
          (parentBounds.x ?? 0) +
          ((parentBounds.width ?? 0) - (mainWindow.getBounds().width ?? 0)) / 2
        y =
          (parentBounds.y ?? 0) +
          ((parentBounds.height ?? 0) - (mainWindow.getBounds().height ?? 0)) / 2
      } else if (options.type === 'left-top') {
        x = (parentBounds.x ?? 0) + (options.bound?.x ?? 0)
        y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
      } else if (options.type === 'right-top') {
        x =
          (parentBounds.x ?? 0) +
          (parentBounds.width ?? 0) -
          (options.bound?.x ?? 0) -
          (parentBounds.width ?? 0)
        y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
      } else if (options.type === 'left-bottom') {
        x = (parentBounds.x ?? 0) + (options.bound?.x ?? 0)
        y =
          (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (parentBounds.height ?? 0)
      } else if (options.type === 'right-bottom') {
        x =
          (parentBounds.x ?? 0) +
          (parentBounds.width ?? 0) -
          (options.bound?.x ?? 0) -
          (parentBounds.width ?? 0)
        y =
          (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (parentBounds.height ?? 0)
      }
      mainWindow.setPosition(x, y)
    }
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    const filePath = join(
      process.env.ELECTRON_RENDERER_URL,
      `${options.hashRoute ? `#${options.hashRoute}` : ''}?${new URLSearchParams(options.params).toString()}`
    )
    mainWindow.loadURL(filePath)
  } else {
    const filePath = options.params
      ? `renderer/index.html${options.hashRoute ? `#${options.hashRoute}` : ''}?${new URLSearchParams(options.params).toString()}`
      : `renderer/index.html${options.hashRoute ? `#${options.hashRoute}` : ''}`
    mainWindow.loadFile(join(__dirname, '..', filePath))
  }

  return mainWindow
}
