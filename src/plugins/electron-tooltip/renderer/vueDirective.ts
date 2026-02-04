import type { Directive } from 'vue'
import { ELECTRON_TOOLTIP_CHANNELS } from '../channels.js'

export type ElectronTooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export type ElectronTooltipBindingValue =
  | string
  | {
    text?: string
    html?: string
    component?: {
      name: string
      props?: Record<string, any>
    }
    behavior?: 'hover' | 'manual'
    placement?: ElectronTooltipPlacement
    offset?: number
    maxWidth?: number
    disabled?: boolean
  }

type NormalizedOptions = Exclude<ElectronTooltipBindingValue, string> & { text?: string }

export type ElectronTooltipBridge = {
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

function defaultBridge(): ElectronTooltipBridge {
  return {
    invoke: (channel: string, ...args: any[]) => (window as any).invoke(channel as any, ...args),
  }
}

function normalizeOptions(v: ElectronTooltipBindingValue): NormalizedOptions {
  if (typeof v === 'string')
    return { text: v }
  return v ?? {}
}

function makeId() {
  try {
    return crypto.randomUUID()
  }
  catch {
    return `tt_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

function getAnchorRect(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}

function rafThrottle(fn: () => void) {
  let raf = 0
  return () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(fn)
  }
}

type Cleanup = () => void

const cleanupMap = new WeakMap<HTMLElement, Cleanup>()
const stateMap = new WeakMap<
  HTMLElement,
  {
    getActiveId: () => string | null
    setActiveId: (id: string | null) => void
    setOptions: (o: NormalizedOptions) => void
    updatePosition: () => void
    attachUpdateListeners: () => void
    detachUpdateListeners: () => void
  }
>()

export function createElectronTooltipDirective(
  bridge: ElectronTooltipBridge = defaultBridge(),
): Directive<HTMLElement, ElectronTooltipBindingValue> {
  return {
    mounted(el, binding) {
      let options = normalizeOptions(binding.value)
      let activeId: string | null = null
      let cleanupUpdateListeners: Cleanup | null = null
      let leaveCleanupTimer: number | null = null

      const updatePosition = rafThrottle(() => {
        if (!el.isConnected)
          return
        if (!activeId || options.disabled)
          return
        bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipUpdateAnchorRect, { id: activeId, anchorRect: getAnchorRect(el) })
      })

      const attachUpdateListeners = () => {
        if (cleanupUpdateListeners)
          return

        const onScroll = () => updatePosition()
        const onResize = () => updatePosition()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onResize)

        const ro = new ResizeObserver(() => updatePosition())
        ro.observe(el)

        cleanupUpdateListeners = () => {
          window.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('resize', onResize)
          ro.disconnect()
        }
      }

      const detachUpdateListeners = () => {
        cleanupUpdateListeners?.()
        cleanupUpdateListeners = null
      }

      const detachUpdateListenersSoon = () => {
        if (leaveCleanupTimer)
          window.clearTimeout(leaveCleanupTimer)
        leaveCleanupTimer = window.setTimeout(() => {
          leaveCleanupTimer = null
          detachUpdateListeners()
        }, 250)
      }

      const onEnter = () => {
        if (options.disabled)
          return

        const text = options.text
        const html = options.html
        const component = options.component
        if (!text && !html && !component)
          return

        if (leaveCleanupTimer) {
          window.clearTimeout(leaveCleanupTimer)
          leaveCleanupTimer = null
        }

        activeId = makeId()
        attachUpdateListeners()

        bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipShow, {
          id: activeId,
          anchorRect: getAnchorRect(el),
          content: {
            text,
            html,
            component,
            maxWidth: options.maxWidth,
          },
          behavior: options.behavior,
          placement: options.placement,
          offset: options.offset,
        })
      }

      const onLeave = () => {
        if (!activeId)
          return
        bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipHide, { id: activeId })
        detachUpdateListenersSoon()
      }

      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerleave', onLeave)

      stateMap.set(el, {
        getActiveId: () => activeId,
        setActiveId: (id) => {
          activeId = id
        },
        setOptions: (o) => {
          options = o
        },
        updatePosition,
        attachUpdateListeners,
        detachUpdateListeners,
      })

      cleanupMap.set(el, () => {
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerleave', onLeave)
        if (leaveCleanupTimer)
          window.clearTimeout(leaveCleanupTimer)
        detachUpdateListeners()
        if (activeId)
          bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipHide, { id: activeId })
        activeId = null
      })
    },
    updated(el, binding) {
      const state = stateMap.get(el)
      if (!state)
        return

      const options = normalizeOptions(binding.value)
      state.setOptions(options)

      const id = state.getActiveId()
      if (options.disabled) {
        state.detachUpdateListeners()
        if (id)
          bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipHide, { id })
        return
      }

      if (!id)
        return

      const text = options.text
      const html = options.html
      const component = options.component
      if (!text && !html && !component)
        return

      state.attachUpdateListeners()
      bridge.invoke(ELECTRON_TOOLTIP_CHANNELS.tooltipShow, {
        id,
        anchorRect: getAnchorRect(el),
        content: { text, html, component, maxWidth: options.maxWidth },
        behavior: options.behavior,
        placement: options.placement,
        offset: options.offset,
      })
      state.updatePosition()
    },
    unmounted(el) {
      cleanupMap.get(el)?.()
      cleanupMap.delete(el)
      stateMap.delete(el)
    },
  }
}

export const vElectronTooltip = createElectronTooltipDirective()
