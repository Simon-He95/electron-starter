import type { WindowOptions } from '../../shared/types.js'
import { join } from 'node:path'
import process from 'node:process'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, screen, shell } from 'electron'
import { useInterval } from 'lazy-js-utils'
import icon from '../../../resources/icon.png?asset'
import { context } from '../index.js'

const windowMap = new Map<
  string,
  {
    mainWindow: BrowserWindow
    type: WindowOptions['type']
  }
>()
const relationMap = new Map<string, { id: string; setPosition: (useAnimate?: boolean) => void }[]>()
const moveThrottleMap = new Map<string, { timeout?: NodeJS.Timeout; last?: number }>()
const DEFAULT_THROTTLE_MS = 50

function getKeyForWindow(win?: BrowserWindow): string | undefined {
  if (!win) return undefined
  for (const [key, w] of windowMap.entries()) {
    if (w.mainWindow === win) return key
  }
  return undefined
}

function clearThrottle(key: string) {
  const entry = moveThrottleMap.get(key)
  if (entry?.timeout) {
    clearTimeout(entry.timeout)
  }
  moveThrottleMap.delete(key)
}

function scheduleThrottledMove(key: string, invoke: () => void, ms = DEFAULT_THROTTLE_MS) {
  const entry = moveThrottleMap.get(key) ?? { last: 0, timeout: undefined }
  const now = Date.now()

  if (entry.last && now - entry.last < ms) {
    if (entry.timeout) return
    entry.timeout = setTimeout(
      () => {
        entry.last = Date.now()
        entry.timeout = undefined
        moveThrottleMap.set(key, entry)
        invoke()
      },
      ms - (now - (entry.last || 0))
    )
    moveThrottleMap.set(key, entry)
    return
  }

  entry.last = now
  moveThrottleMap.set(key, entry)
  invoke()
}
export function createWindow(options: WindowOptions = { windowConfig: {} }) {
  // Create the browser window.
  // 当设置了 bound 时，parent 不应该生效，因为有 parent 的话，window 会出现在 parent 的中央
  if (options.id && windowMap.has(options.id)) {
    const win = windowMap.get(options.id)!
    if (!win.mainWindow.isDestroyed()) {
      win.mainWindow.focus()
      return win.mainWindow
    }
  }

  const windowConfig = Object.assign(
    {
      alwaysOnTop: true,
      animate: {
        duration: 16,
        offsetX: 0,
        offsetY: -50
      },
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

  const idKey = options.id || `$$${mainWindow.id}`
  windowMap.set(idKey, {
    mainWindow,
    type: options.type || 'center'
  })

  function getParent() {
    // find the parent key in relationMap whose children list contains this window idKey
    let foundPid: string | undefined
    for (const [pid, children] of relationMap.entries()) {
      if (children && children.some((item) => item.id === idKey)) {
        foundPid = pid
        break
      }
    }

    const parent =
      foundPid && windowMap.has(String(foundPid))
        ? windowMap.get(String(foundPid))?.mainWindow
        : options.windowConfig?.parent || BrowserWindow.getFocusedWindow() || context.mainWindow

    return parent
  }
  function setPosition(useAnimate = true) {
    const parent = getParent()
    const parentBounds = parent?.getBounds()
    if (!parentBounds) {
      return
    }
    if (options.isFollowMove && !windowConfig.modal) {
      // determine parent's key in windowMap (could be a custom options.id or the generated $$id)
      const parentKey = getKeyForWindow(parent) ?? `$$${parent.id}`

      const id = options.id || `$$${mainWindow.id}`
      const children = relationMap.has(parentKey) ? relationMap.get(parentKey)! : []
      if (!children.some((item) => item.id === id)) {
        children.push({
          id,
          setPosition: () => setPosition(false)
        })
      }
      relationMap.set(parentKey, children)
    }
    let x, y
    if (!options.type || options.type === 'center') {
      x = Math.max(
        (parentBounds.x ?? 0) +
          ((parentBounds.width ?? 0) - (mainWindow.getBounds().width ?? 0)) / 2,
        0
      )
      y = Math.max(
        (parentBounds.y ?? 0) +
          ((parentBounds.height ?? 0) - (mainWindow.getBounds().height ?? 0)) / 2,
        0
      )
    } else if (options.type === 'left-top-in') {
      x = (parentBounds.x ?? 0) + (options.bound?.x ?? 0)
      y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
    } else if (options.type === 'left-top-out') {
      x = Math.max(
        (parentBounds.x ?? 0) + (options.bound?.x ?? 0) - (mainWindow.getBounds().width ?? 0),
        0
      )
      y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
    } else if (options.type === 'right-top-out') {
      x = Math.max((parentBounds.x ?? 0) + (parentBounds.width ?? 0) - (options.bound?.x ?? 0), 0)
      try {
        const bounds = mainWindow.getBounds()
        const disp = screen.getDisplayMatching(bounds)
        const maxX = disp.bounds.x + disp.bounds.width
        const newWidth = bounds.width
        if (x + newWidth > maxX) {
          x = Math.max(maxX - newWidth, 0)
        }
      } catch {
        // ignore
      }
      y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
    } else if (options.type === 'right-top-in') {
      x = Math.max(
        (parentBounds.x ?? 0) +
          (parentBounds.width ?? 0) -
          (options.bound?.x ?? 0) -
          (mainWindow.getBounds().width ?? 0),
        0
      )
      y = (parentBounds.y ?? 0) + (options.bound?.y ?? 0)
    } else if (options.type === 'left-bottom-in') {
      x = (parentBounds.x ?? 0) + (options.bound?.x ?? 0)
      y = Math.max(
        (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (mainWindow.getBounds().height ?? 0),
        0
      )
    } else if (options.type === 'left-bottom-out') {
      x = Math.max(
        (parentBounds.x ?? 0) + (options.bound?.x ?? 0) - (mainWindow.getBounds().width ?? 0),
        0
      )
      y = Math.max(
        (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (mainWindow.getBounds().height ?? 0),
        0
      )
    } else if (options.type === 'right-bottom-out') {
      x = Math.max((parentBounds.x ?? 0) + (parentBounds.width ?? 0) - (options.bound?.x ?? 0), 0)
      try {
        const bounds = mainWindow.getBounds()
        const disp = screen.getDisplayMatching(bounds)
        const maxX = disp.bounds.x + disp.bounds.width
        const newWidth = bounds.width
        if (x + newWidth > maxX) {
          x = Math.max(maxX - newWidth, 0)
        }
      } catch {
        // ignore
      }
      y = Math.max(
        (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (mainWindow.getBounds().height ?? 0),
        0
      )
    } else if (options.type === 'right-bottom-in') {
      x =
        (parentBounds.x ?? 0) +
        (parentBounds.width ?? 0) -
        (options.bound?.x ?? 0) -
        (mainWindow.getBounds().width ?? 0)
      y = Math.max(
        (parentBounds.y ?? 0) +
          (parentBounds.height ?? 0) -
          (options.bound?.y ?? 0) -
          (mainWindow.getBounds().height ?? 0),
        0
      )
    } else {
      throw new Error(`type: [${options.type}] is not supported`)
    }

    if (useAnimate) {
      let offsetX = windowConfig.animate.offsetX ?? 0
      let offsetY = windowConfig.animate.offsetY ?? -50
      let opacity = 0
      mainWindow.setOpacity(opacity)
      if (options.bound?.width || options.bound?.height) {
        mainWindow.setBounds(
          {
            height: options.bound?.height,
            width: options.bound?.width,
            x: Math.floor(x - offsetX),
            y: Math.floor(y - offsetY)
          },
          true
        )
        setTimeout(() => {
          const { pause } = useInterval(() => {
            opacity += 0.1
            offsetX = offsetX * 0.7
            offsetY = offsetY * 0.7
            if (opacity >= 1) {
              mainWindow.setOpacity(1)
              mainWindow.setBounds(
                {
                  height: options.bound?.height,
                  width: options.bound?.width,
                  x,
                  y
                },
                true
              )
              pause()
            } else {
              mainWindow.setOpacity(opacity)
              mainWindow.setBounds(
                {
                  height: options.bound?.height,
                  width: options.bound?.width,
                  x: Math.floor(x - offsetX),
                  y: Math.floor(y - offsetY)
                },
                true
              )
            }
          }, windowConfig.animate?.duration ?? 16)
        })
      } else {
        mainWindow.setPosition(Math.floor(x - offsetX), Math.floor(y - offsetY), true)
        setTimeout(() => {
          const { pause } = useInterval(() => {
            opacity += 0.1
            offsetX = offsetX * 0.7
            offsetY = offsetY * 0.7
            if (opacity >= 1) {
              mainWindow.setOpacity(1)
              mainWindow.setPosition(x, y, true)
              pause()
            } else {
              mainWindow.setOpacity(opacity)
              mainWindow.setPosition(Math.floor(x - offsetX), Math.floor(y - offsetY), true)
            }
          }, windowConfig.animate?.duration ?? 16)
        })
      }
    } else {
      if (options.bound?.width || options.bound?.height) {
        mainWindow.setBounds({
          height: options.bound?.height,
          width: options.bound?.width,
          x,
          y
        })
      } else {
        mainWindow.setPosition(x, y)
      }
    }
  }

  mainWindow.on('ready-to-show', () => {
    // 如果有 parent，则相对于 parent 定位
    setPosition(!!windowConfig.animate)

    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    // 如果你在 context 或其它地方保存了引用，清理它
    // use the same idKey we used when registering the window
    // 删除该 id 下的子 id
    if (relationMap.has(idKey)) {
      relationMap.delete(idKey)
    }
    // 删除该窗口在父 id 下的引用
    relationMap.forEach((children, pid) => {
      const index = children.findIndex((item) => item.id === idKey)
      if (index > -1) {
        children.splice(index, 1)
        relationMap.set(pid, children)
      }
    })
    // 清理该父窗口的节流定时器（如果存在）
    clearThrottle(idKey)
    windowMap.delete(idKey)
    if (context.mainWindow === mainWindow) {
      context.mainWindow = undefined
      // mainWindow 被销毁了，所有的 windowMap 里的引用都应该被清理掉
      windowMap.forEach((win, id) => {
        windowMap.delete(id)
        win.mainWindow.removeAllListeners()
        win.mainWindow.destroy()
      })
    } else {
      mainWindow.removeAllListeners()
      mainWindow.destroy()
    }
  })

  mainWindow.on('move', () => {
    const pid = idKey
    if (!relationMap.has(pid)) return
    scheduleThrottledMove(pid, () => {
      const children = relationMap.get(pid)!
      children.forEach((child) => child.setPosition(false))
    })
  })

  mainWindow.on('blur', () => {
    // 上报给渲染进程
    BrowserWindow.getAllWindows().forEach((w) =>
      w.webContents.send('window-blur', { hashRoute: options.hashRoute, id: mainWindow.id })
    )
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const params = Object.assign(options.params || {}, { __winId: mainWindow.id })
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    const filePath = join(
      process.env.ELECTRON_RENDERER_URL,
      `${options.hashRoute ? `#${options.hashRoute}` : ''}?${new URLSearchParams(params).toString()}`
    )
    mainWindow.loadURL(filePath)
  } else {
    const filePath = options.params
      ? `renderer/index.html${options.hashRoute ? `#${options.hashRoute}` : ''}?${new URLSearchParams(params).toString()}`
      : `renderer/index.html${options.hashRoute ? `#${options.hashRoute}` : ''}`
    mainWindow.loadFile(join(__dirname, '..', filePath))
  }

  return mainWindow
}

export function updateWindowBounds(options: {
  id: string
  bounds: {
    width?: number
    height?: number
  }
}) {
  const idKey = windowMap.has(options.id) ? options.id : `$$${options.id}`
  const win = windowMap.get(idKey)
  if (!win?.mainWindow || win.mainWindow.isDestroyed()) return false
  const type = win.type
  const bounds = win.mainWindow.getBounds()
  if (type === 'center') {
    // 居中情况下, 更新 width 、 height 时，仍然保持居中
    // 如果设置了宽度和高度， 移动位置应该是原本 x 和 y 减去宽高变化的一半
    if (options.bounds.width) {
      bounds.x = bounds.x - (options.bounds.width - bounds.width) / 2
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.y = bounds.y - (options.bounds.height - bounds.height) / 2
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'left-top-in') {
    // 左上角内侧， 更新 width 、 height 时，保持左上角位置不变 直接更新宽高
    if (options.bounds.width) {
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'left-top-out') {
    // 左上角外侧， 更新 width 、 height 时，保持左上角位置不变 x 需要加上宽度的变化
    if (options.bounds.width) {
      bounds.x = Math.max(bounds.x - (options.bounds.width - bounds.width), 0)
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'right-top-out') {
    // 右上角外侧， 更新 width 、 height 时，保持右上角位置不变 x 需要减去宽度的变化
    if (options.bounds.width) {
      bounds.width = options.bounds.width
      // 防止超出屏幕右边界
      try {
        const disp = screen.getDisplayMatching(bounds)
        const maxX = disp.bounds.x + disp.bounds.width
        const newWidth = options.bounds.width
        if (bounds.x + newWidth > maxX) {
          bounds.x = Math.max(maxX - newWidth, 0)
        }
      } catch {
        // ignore
      }
    }
    if (options.bounds.height) {
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'right-top-in') {
    // 右上角内侧， 更新 width 、 height 时，保持右上角位置不变 x 需要加上宽度的变化
    if (options.bounds.width) {
      bounds.x = Math.max(bounds.x - (options.bounds.width - bounds.width), 0)
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'left-bottom-in') {
    // 左下角内侧， 更新 width 、 height 时，保持左下角位置不变 y 需要加上高度的变化
    if (options.bounds.width) {
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.y = bounds.y - (options.bounds.height - bounds.height)
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'left-bottom-out') {
    // 左下角外侧， 更新 width 、 height 时，保持左下角位置不变 x 需要加上宽度的变化，y 需要加上高度的变化
    if (options.bounds.width) {
      bounds.x = Math.max(bounds.x - (options.bounds.width - bounds.width), 0)
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.y = Math.max(bounds.y - (options.bounds.height - bounds.height), 0)
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'right-bottom-out') {
    // 右下角外侧， 更新 width 、 height 时，保持右下角位置不变 x 需要减去宽度的变化，y 需要加上高度的变化
    if (options.bounds.width) {
      bounds.width = options.bounds.width
      // 防止超出屏幕右边界
      try {
        const disp = screen.getDisplayMatching(bounds)
        const maxX = disp.bounds.x + disp.bounds.width
        const newWidth = options.bounds.width
        if (bounds.x + newWidth > maxX) {
          bounds.x = Math.max(maxX - newWidth, 0)
        }
      } catch {
        // ignore
      }
    }
    if (options.bounds.height) {
      bounds.y = Math.max(bounds.y - (options.bounds.height - bounds.height), 0)
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  } else if (type === 'right-bottom-in') {
    // 右下角内侧， 更新 width 、 height 时，保持右下角位置不变 x 需要减去宽度的变化，y 需要加上高度的变化
    if (options.bounds.width) {
      bounds.x = Math.max(bounds.x - (options.bounds.width - bounds.width), 0)
      bounds.width = options.bounds.width
    }
    if (options.bounds.height) {
      bounds.y = Math.max(bounds.y - (options.bounds.height - bounds.height), 0)
      bounds.height = options.bounds.height
    }
    win.mainWindow.setBounds(bounds)
  }
  return true
}
