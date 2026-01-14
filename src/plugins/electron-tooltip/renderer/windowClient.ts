import type { TooltipSetPayload } from '../schemas.js'
import { ELECTRON_TOOLTIP_CHANNELS, ELECTRON_TOOLTIP_EVENTS } from '../channels.js'

export type ElectronTooltipWindowBridge = {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  onIpc: (channel: string, listener: (...args: any[]) => void) => any
}

export type TooltipWindowState = {
  ready: boolean
  payload: TooltipSetPayload
}

export type CreateElectronTooltipWindowClientOptions = {
  initialPayload?: TooltipSetPayload
}

export type ElectronTooltipWindowClient = {
  getState: () => TooltipWindowState
  subscribe: (fn: (s: TooltipWindowState) => void) => () => void
  start: () => void
  stop: () => void
  setTooltipHovered: (hovered: boolean) => void
  reportSize: (size: { width: number, height: number }) => void
  close: () => void
  setPinned: (pinned: boolean) => void
}

const DEFAULT_PAYLOAD: TooltipSetPayload = {
  id: '',
  content: { text: '' },
  placement: 'top',
  maxWidth: 320,
}

export function createElectronTooltipWindowClient(
  bridge: ElectronTooltipWindowBridge,
  opts: CreateElectronTooltipWindowClientOptions = {},
): ElectronTooltipWindowClient {
  let state: TooltipWindowState = {
    ready: false,
    payload: opts.initialPayload ?? DEFAULT_PAYLOAD,
  }

  const listeners = new Set<(s: TooltipWindowState) => void>()

  const emit = () => {
    for (const fn of listeners) fn(state)
  }

  const onSet = (p: TooltipSetPayload) => {
    state = { ready: true, payload: p }
    emit()
  }

  let started = false

  return {
    getState: () => state,
    subscribe: (fn) => {
      listeners.add(fn)
      fn(state)
      return () => listeners.delete(fn)
    },
    start: () => {
      if (started)
        return
      started = true

      // Register listener first, then handshake.
      bridge.onIpc(ELECTRON_TOOLTIP_EVENTS.tooltipSet, onSet)
      void bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipRendererReady)
    },
    stop: () => {
      if (!started)
        return
      started = false
      // Best-effort: most apps keep the tooltip window alive for the app lifetime;
      // some preload `onIpc` wrappers don't allow removing the exact internal listener.
    },
    setTooltipHovered: (hovered) => {
      void bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipSetTooltipHovered, hovered)
    },
    reportSize: (size) => {
      void bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipReportSize, size)
    },
    close: () => {
      const id = state.payload.id
      if (id)
        void bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipClose, { id })
    },
    setPinned: (pinned) => {
      const id = state.payload.id
      if (id)
        void bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipSetPinned, { id, pinned })
    },
  }
}
