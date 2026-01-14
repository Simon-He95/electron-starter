import type { BrowserWindow as ElectronBrowserWindow } from 'electron'
import { join } from 'node:path'
import process from 'node:process'
import { ElectronTooltipManager } from '../../plugins/electron-tooltip/main/TooltipManager.js'

function loadTooltipWindow(win: ElectronBrowserWindow) {
  const params = new URLSearchParams({
    __winId: String(win.id),
    __tooltip: '1',
  })

  if (process.env.NODE_ENV !== 'production' && process.env.ELECTRON_RENDERER_URL) {
    // Keep consistent with existing createWindow.ts behavior.
    const url = join(process.env.ELECTRON_RENDERER_URL, `#tooltip?${params.toString()}`)
    win.loadURL(url)
    return
  }

  // Production: electron-vite packages renderer under `renderer/index.html`
  win.loadFile(join(__dirname, '..', `renderer/index.html#tooltip?${params.toString()}`))
}

export const tooltipManager = new ElectronTooltipManager({
  preloadPath: join(__dirname, '../preload/index.mjs'),
  loadTooltipWindow,
})

