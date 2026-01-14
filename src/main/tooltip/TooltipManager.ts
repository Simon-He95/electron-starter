import type { BrowserWindow as ElectronBrowserWindow } from 'electron'
import type { SchemaInputs } from '../../shared/schemas.js'
import { join } from 'node:path'
import process from 'node:process'
import electron from 'electron'

const { BrowserWindow, screen } = electron as any

type TooltipPlacement = NonNullable<SchemaInputs['tooltipShow']['placement']>

type AnchorRect = SchemaInputs['tooltipShow']['anchorRect']

type TooltipContent = SchemaInputs['tooltipShow']['content']

type TooltipSetEventPayload = {
  content: TooltipContent
  placement: TooltipPlacement
  maxWidth?: number
}

const DEFAULT_PLACEMENT: TooltipPlacement = 'top'
const DEFAULT_OFFSET = 10
const DEFAULT_MAX_WIDTH = 320

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getTooltipUrl(tooltipWin: ElectronBrowserWindow) {
  const params = new URLSearchParams({
    __winId: String(tooltipWin.id),
    __tooltip: '1',
  })

  if (process.env.NODE_ENV !== 'production' && process.env.ELECTRON_RENDERER_URL) {
    // Keep consistent with createWindow.ts behavior (path.join over URL-like strings is tolerated).
    return join(process.env.ELECTRON_RENDERER_URL, `#tooltip?${params.toString()}`)
  }

  return join(__dirname, '..', `renderer/index.html#tooltip?${params.toString()}`)
}

function computePlacementOrder(preferred: TooltipPlacement) {
  switch (preferred) {
    case 'top':
      return ['top', 'bottom', 'right', 'left'] as const
    case 'bottom':
      return ['bottom', 'top', 'right', 'left'] as const
    case 'right':
      return ['right', 'left', 'top', 'bottom'] as const
    case 'left':
      return ['left', 'right', 'top', 'bottom'] as const
    default:
      return ['top', 'bottom', 'right', 'left'] as const
  }
}

function computeCandidatePosition(args: {
  placement: TooltipPlacement
  anchor: AnchorRect
  tooltip: { width: number, height: number }
  offset: number
}) {
  const { placement, anchor, tooltip, offset } = args

  const cx = anchor.x + anchor.width / 2
  const cy = anchor.y + anchor.height / 2

  if (placement === 'top') {
    return { x: Math.round(cx - tooltip.width / 2), y: Math.round(anchor.y - tooltip.height - offset) }
  }
  if (placement === 'bottom') {
    return { x: Math.round(cx - tooltip.width / 2), y: Math.round(anchor.y + anchor.height + offset) }
  }
  if (placement === 'left') {
    return { x: Math.round(anchor.x - tooltip.width - offset), y: Math.round(cy - tooltip.height / 2) }
  }
  return { x: Math.round(anchor.x + anchor.width + offset), y: Math.round(cy - tooltip.height / 2) }
}

function overflowScore(workArea: Electron.Rectangle, bounds: Electron.Rectangle) {
  const overflowLeft = Math.max(workArea.x - bounds.x, 0)
  const overflowTop = Math.max(workArea.y - bounds.y, 0)
  const overflowRight = Math.max(bounds.x + bounds.width - (workArea.x + workArea.width), 0)
  const overflowBottom = Math.max(bounds.y + bounds.height - (workArea.y + workArea.height), 0)
  return overflowLeft + overflowTop + overflowRight + overflowBottom
}

export class TooltipManager {
  private tooltipWin: ElectronBrowserWindow | null = null
  private parentWin: ElectronBrowserWindow | null = null

  private anchorRect: AnchorRect | null = null
  private tooltipContentSize = { width: 220, height: 40 }

  private isAnchorHovered = false
  private isTooltipHovered = false
  private hideTimer: NodeJS.Timeout | null = null

  private lastSetPayload: TooltipSetEventPayload | null = null
  private currentPlacement: TooltipPlacement = DEFAULT_PLACEMENT
  private currentTooltipId: string | null = null
  private webReady = false
  private pendingShow = false
  private pendingOffset = DEFAULT_OFFSET
  private awaitingFirstSize = false

  constructor() {
    try {
      screen.on('display-metrics-changed', () => this.reposition())
    }
    catch {
      // ignore
    }
  }

  show(parentWin: ElectronBrowserWindow, params: SchemaInputs['tooltipShow']) {
    this.parentWin = parentWin
    this.anchorRect = params.anchorRect
    this.isAnchorHovered = true
    this.currentTooltipId = params.id
    this.pendingOffset = params.offset ?? DEFAULT_OFFSET

    const placement = params.placement ?? DEFAULT_PLACEMENT
    this.currentPlacement = placement
    const maxWidth = params.content.maxWidth ?? DEFAULT_MAX_WIDTH
    const setPayload: TooltipSetEventPayload = { content: { ...params.content, maxWidth }, placement, maxWidth }
    this.lastSetPayload = setPayload

    this.cancelHide()
    this.ensureWindow()

    this.attachParentListeners(parentWin)

    // First hover may happen before tooltip renderer finishes loading; showing too early
    // causes an empty/transparent flash. Defer showing until `did-finish-load`.
    if (!this.webReady) {
      this.pendingShow = true
      this.awaitingFirstSize = true
      return
    }

    // If the tooltip is currently hidden, wait for a size report for this payload
    // before showing, so we avoid a "jump" when the real content size arrives.
    const win = this.tooltipWin
    const shouldHandshake = !win || win.isDestroyed() || !win.isVisible()
    this.awaitingFirstSize = shouldHandshake

    this.sendPayload()
    if (!shouldHandshake) {
      this.reposition(this.pendingOffset)
      this.showTooltipWindow()
    }
  }

  updateAnchorRect(parentWin: ElectronBrowserWindow, params: SchemaInputs['tooltipUpdateAnchorRect']) {
    if (this.currentTooltipId && params.id !== this.currentTooltipId)
      return
    if (this.parentWin && this.parentWin.id !== parentWin.id) {
      // Ignore stale updates from a different window.
      return
    }
    this.parentWin = parentWin
    this.anchorRect = params.anchorRect
    this.reposition()
  }

  hideFromAnchorLeave(params: SchemaInputs['tooltipHide']) {
    if (this.currentTooltipId && params.id !== this.currentTooltipId)
      return
    this.isAnchorHovered = false
    this.pendingShow = false
    this.awaitingFirstSize = false
    this.scheduleHide()
  }

  forceHide() {
    this.isAnchorHovered = false
    this.isTooltipHovered = false
    this.cancelHide()
    this.currentTooltipId = null
    this.pendingShow = false
    this.awaitingFirstSize = false
    this.hideWindow()
  }

  setTooltipHovered(hovered: boolean) {
    this.isTooltipHovered = hovered
    if (!hovered)
      this.scheduleHide()
    else
      this.cancelHide()
  }

  reportContentSize(params: SchemaInputs['tooltipReportSize']) {
    const w = Math.max(1, Math.round(params.width))
    const h = Math.max(1, Math.round(params.height))
    const changed = w !== this.tooltipContentSize.width || h !== this.tooltipContentSize.height
    if (changed) {
      this.tooltipContentSize = { width: w, height: h }
      this.reposition()
    }
    else {
      // Even if size didn't change (e.g. matches defaults), the first report still
      // indicates the renderer has measured content and is ready to show.
      this.reposition()
    }

    if (this.awaitingFirstSize && this.isAnchorHovered) {
      this.awaitingFirstSize = false
      this.showTooltipWindow()
    }
  }

  private scheduleHide() {
    if (this.isAnchorHovered || this.isTooltipHovered)
      return
    if (this.hideTimer)
      return
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null
      if (!this.isAnchorHovered && !this.isTooltipHovered)
        this.hideWindow()
    }, 120)
  }

  private cancelHide() {
    if (!this.hideTimer)
      return
    clearTimeout(this.hideTimer)
    this.hideTimer = null
  }

  private ensureWindow() {
    if (this.tooltipWin && !this.tooltipWin.isDestroyed())
      return

    const win = new BrowserWindow({
      width: 240,
      height: 60,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      autoHideMenuBar: true,
      useContentSize: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
      },
    })

    this.webReady = false

    try {
      win.setAlwaysOnTop(true, process.platform === 'darwin' ? 'floating' : 'screen-saver')
    }
    catch {
      win.setAlwaysOnTop(true)
    }

    win.on('closed', () => {
      if (this.tooltipWin === win)
        this.tooltipWin = null
    })

    this.tooltipWin = win

    const urlOrFile = getTooltipUrl(win)
    if (typeof urlOrFile === 'string') {
      if (urlOrFile.startsWith('http')) {
        win.loadURL(urlOrFile)
      }
      else {
        win.loadFile(urlOrFile)
      }
    }

    // NOTE: `did-finish-load` can fire before the Vue app registers ipc listeners in the
    // tooltip renderer page. We rely on an explicit `tooltipRendererReady` IPC handshake.
    win.webContents.on('did-finish-load', () => {
      // noop
    })
  }

  onRendererReady(fromWin: ElectronBrowserWindow) {
    const win = this.tooltipWin
    if (!win || win.isDestroyed())
      return
    if (fromWin.id !== win.id)
      return
    this.webReady = true

    // If a hover is pending, send payload now (the renderer is guaranteed to be listening).
    if (this.lastSetPayload) {
      this.sendPayload()
      this.reposition(this.pendingOffset)
    }
  }

  private sendPayload() {
    const win = this.tooltipWin
    if (!win || win.isDestroyed())
      return

    try {
      if (this.lastSetPayload)
        win.webContents.send('tooltip-set', this.lastSetPayload)
    }
    catch {
      // ignore
    }

    // If this send corresponds to a pending hover, keep waiting for a size report
    // before showing to prevent initial flicker/jump.
    if (this.pendingShow) {
      this.pendingShow = false
      this.awaitingFirstSize = true
    }
  }

  private showTooltipWindow() {
    const win = this.tooltipWin
    if (!win || win.isDestroyed())
      return

    try {
      if (!win.isVisible())
        win.showInactive()
      else
        win.showInactive()
    }
    catch {
      win.show()
    }
  }

  private hideWindow() {
    const win = this.tooltipWin
    if (!win || win.isDestroyed())
      return
    try {
      win.hide()
    }
    catch {
      // ignore
    }
  }

  private attachParentListeners(parent: ElectronBrowserWindow) {
    if (this.parentWin && this.parentWin.id !== parent.id)
      return

    const key = '__tooltip_listeners_attached__'
    if ((parent as any)[key])
      return
    ;(parent as any)[key] = true

    const onChange = () => this.reposition()
    const onBlur = () => {
      // If the app loses focus entirely, hide to avoid "orphan" tooltips.
      this.forceHide()
    }
    const onHide = () => this.forceHide()

    parent.on('move', onChange)
    parent.on('resize', onChange)
    parent.on('enter-full-screen', onChange)
    parent.on('leave-full-screen', onChange)
    parent.on('hide', onHide)
    parent.on('minimize', onHide)
    parent.on('closed', onHide)
    parent.on('blur', onBlur)

    parent.once('closed', () => {
      try {
        parent.removeListener('move', onChange)
        parent.removeListener('resize', onChange)
        parent.removeListener('enter-full-screen', onChange)
        parent.removeListener('leave-full-screen', onChange)
        parent.removeListener('hide', onHide)
        parent.removeListener('minimize', onHide)
        parent.removeListener('closed', onHide)
        parent.removeListener('blur', onBlur)
      }
      catch {
        // ignore
      }
      ;(parent as any)[key] = false
    })
  }

  private reposition(offset?: number) {
    const parent = this.parentWin
    const win = this.tooltipWin
    const anchor = this.anchorRect
    if (!parent || !win || !anchor || win.isDestroyed() || parent.isDestroyed())
      return

    const parentContent = parent.getContentBounds()
    const anchorOnScreen: AnchorRect = {
      x: parentContent.x + anchor.x,
      y: parentContent.y + anchor.y,
      width: anchor.width,
      height: anchor.height,
    }

    const disp = screen.getDisplayNearestPoint({
      x: Math.round(anchorOnScreen.x + anchorOnScreen.width / 2),
      y: Math.round(anchorOnScreen.y + anchorOnScreen.height / 2),
    })
    const workArea = disp.workArea

    const desiredPlacement = this.currentPlacement ?? DEFAULT_PLACEMENT
    const candidates = computePlacementOrder(desiredPlacement)
    const tooltipSize = { ...this.tooltipContentSize }
    const finalOffset = offset ?? DEFAULT_OFFSET

    let best: { placement: TooltipPlacement, bounds: Electron.Rectangle, score: number } | null = null
    for (const placement of candidates) {
      const pos = computeCandidatePosition({
        placement,
        anchor: anchorOnScreen,
        tooltip: tooltipSize,
        offset: finalOffset,
      })
      const bounds: Electron.Rectangle = { x: pos.x, y: pos.y, width: tooltipSize.width, height: tooltipSize.height }
      const score = overflowScore(workArea, bounds)
      if (!best || score < best.score) {
        best = { placement, bounds, score }
        if (score === 0)
          break
      }
    }

    if (!best)
      return

    if (best.placement !== this.currentPlacement) {
      this.currentPlacement = best.placement
      try {
        if (this.lastSetPayload) {
          const updated: TooltipSetEventPayload = { ...this.lastSetPayload, placement: best.placement }
          this.lastSetPayload = updated
          win.webContents.send('tooltip-set', updated)
        }
      }
      catch {
        // ignore
      }
    }

    const clamped: Electron.Rectangle = {
      width: best.bounds.width,
      height: best.bounds.height,
      x: clamp(best.bounds.x, workArea.x, workArea.x + workArea.width - best.bounds.width),
      y: clamp(best.bounds.y, workArea.y, workArea.y + workArea.height - best.bounds.height),
    }

    try {
      win.setBounds(clamped, false)
    }
    catch {
      // ignore
    }
  }
}

export const tooltipManager = new TooltipManager()
