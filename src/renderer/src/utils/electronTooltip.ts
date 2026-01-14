import type { Directive } from 'vue'

export type ElectronTooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export type ElectronTooltipBindingValue =
  | string
  | {
    text?: string
    html?: string
    placement?: ElectronTooltipPlacement
    offset?: number
    maxWidth?: number
    disabled?: boolean
  }

type NormalizedOptions = Exclude<ElectronTooltipBindingValue, string> & { text?: string }

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
    getOptions: () => NormalizedOptions
    setOptions: (o: NormalizedOptions) => void
    updatePosition: () => void
    attachUpdateListeners: () => void
    setMode: (mode: 'detached' | 'inline') => void
    getMode: () => 'detached' | 'inline'
    showInline: () => void
    hideInlineFromAnchorLeave: () => void
    forceHideInline: () => void
  }
>()

export const vElectronTooltip: Directive<HTMLElement, ElectronTooltipBindingValue> = {
  mounted(el, binding) {
    let options = normalizeOptions(binding.value)
    let activeId: string | null = null
    let cleanupUpdateListeners: Cleanup | null = null
    let leaveCleanupTimer: number | null = null
    let mode: 'detached' | 'inline' = 'detached'

    let inlineRoot: HTMLDivElement | null = null
    let inlineHideTimer: number | null = null
    let inlineAnchorHovered = false
    let inlineTooltipHovered = false

    const isMac = () => /Macintosh|Mac OS X/.test(navigator.userAgent)

    let lastFullscreenCheckAt = 0
    let cachedIsFullScreen: boolean | null = null
    async function isFullScreenWindow() {
      const now = Date.now()
      if (cachedIsFullScreen !== null && now - lastFullscreenCheckAt < 500)
        return cachedIsFullScreen
      lastFullscreenCheckAt = now
      try {
        const res = await window.invoke('getCurrentWindowState')
        cachedIsFullScreen = !!res?.isFullScreen
        return cachedIsFullScreen
      }
      catch {
        cachedIsFullScreen = null
        return false
      }
    }

    const updatePosition = rafThrottle(() => {
      if (!el.isConnected)
        return
      if (mode === 'inline') {
        positionInline()
        return
      }
      if (!activeId || options.disabled)
        return
      window.invoke('tooltipUpdateAnchorRect', { id: activeId, anchorRect: getAnchorRect(el) })
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

    function ensureInlineRoot() {
      if (inlineRoot)
        return inlineRoot
      const root = document.createElement('div')
      root.style.position = 'fixed'
      root.style.left = '0'
      root.style.top = '0'
      root.style.zIndex = '2147483647'
      root.style.pointerEvents = 'auto'
      root.style.opacity = '0'
      root.style.transform = 'translate(-99999px, -99999px)'
      root.addEventListener('pointerenter', () => {
        inlineTooltipHovered = true
        cancelInlineHide()
      })
      root.addEventListener('pointerleave', () => {
        inlineTooltipHovered = false
        scheduleInlineHide()
      })
      document.body.appendChild(root)
      inlineRoot = root
      return root
    }

    function clearInlineRoot() {
      cancelInlineHide()
      if (!inlineRoot)
        return
      inlineRoot.remove()
      inlineRoot = null
    }

    function scheduleInlineHide() {
      if (inlineAnchorHovered || inlineTooltipHovered)
        return
      if (inlineHideTimer !== null)
        return
      inlineHideTimer = window.setTimeout(() => {
        inlineHideTimer = null
        if (!inlineAnchorHovered && !inlineTooltipHovered)
          clearInlineRoot()
      }, 120)
    }

    function cancelInlineHide() {
      if (inlineHideTimer === null)
        return
      window.clearTimeout(inlineHideTimer)
      inlineHideTimer = null
    }

    function computeInlineBestPosition(args: {
      anchor: ReturnType<typeof getAnchorRect>
      tooltip: { width: number, height: number }
      preferred: ElectronTooltipPlacement
      offset: number
    }) {
      const { anchor, tooltip, preferred, offset } = args
      const vw = window.innerWidth
      const vh = window.innerHeight

      const cx = anchor.x + anchor.width / 2
      const cy = anchor.y + anchor.height / 2

      const order: ElectronTooltipPlacement[] = preferred === 'top'
        ? ['top', 'bottom', 'right', 'left']
        : preferred === 'bottom'
          ? ['bottom', 'top', 'right', 'left']
          : preferred === 'right'
            ? ['right', 'left', 'top', 'bottom']
            : ['left', 'right', 'top', 'bottom']

      const score = (x: number, y: number) => {
        const overflowLeft = Math.max(0 - x, 0)
        const overflowTop = Math.max(0 - y, 0)
        const overflowRight = Math.max(x + tooltip.width - vw, 0)
        const overflowBottom = Math.max(y + tooltip.height - vh, 0)
        return overflowLeft + overflowTop + overflowRight + overflowBottom
      }

      let best: { placement: ElectronTooltipPlacement, x: number, y: number, score: number } | null = null
      for (const placement of order) {
        let x = 0
        let y = 0
        if (placement === 'top') {
          x = Math.round(cx - tooltip.width / 2)
          y = Math.round(anchor.y - tooltip.height - offset)
        }
        else if (placement === 'bottom') {
          x = Math.round(cx - tooltip.width / 2)
          y = Math.round(anchor.y + anchor.height + offset)
        }
        else if (placement === 'left') {
          x = Math.round(anchor.x - tooltip.width - offset)
          y = Math.round(cy - tooltip.height / 2)
        }
        else {
          x = Math.round(anchor.x + anchor.width + offset)
          y = Math.round(cy - tooltip.height / 2)
        }
        const s = score(x, y)
        if (!best || s < best.score) {
          best = { placement, x, y, score: s }
          if (s === 0)
            break
        }
      }

      if (!best) {
        return { placement: preferred, x: 0, y: 0 }
      }

      const clampedX = Math.max(0, Math.min(best.x, vw - tooltip.width))
      const clampedY = Math.max(0, Math.min(best.y, vh - tooltip.height))
      return { placement: best.placement, x: clampedX, y: clampedY }
    }

    function setInlineContent() {
      const root = ensureInlineRoot()
      const maxWidth = options.maxWidth ?? 320
      const text = options.text
      const html = options.html

      root.innerHTML = `
        <div class="w-fit h-fit p-2">
          <div class="relative rounded-md border bg-popover text-popover-foreground shadow-[0_0_18px_rgba(0,0,0,0.12)] px-3 py-2 text-xs leading-relaxed" style="max-width:${maxWidth}px">
            <div data-et-arrow-wrap="1" class="absolute pointer-events-none">
              <svg data-et-arrow-svg="1" class="block drop-shadow-[0_0_10px_rgba(0,0,0,0.10)]" width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path data-et-arrow-path="1" d="M0 0L6 6L12 0Z" fill="hsl(var(--popover))" stroke="hsl(var(--border))" stroke-linejoin="round"></path>
              </svg>
            </div>
            ${
              text
                ? `<div class="whitespace-pre-wrap break-words"></div>`
                : html
                  ? `<div class="prose prose-sm max-w-none"></div>`
                  : ''
            }
          </div>
        </div>
      `

      const contentEl = root.querySelector('div.whitespace-pre-wrap') as HTMLDivElement | null
      if (contentEl && text)
        contentEl.textContent = text

      const htmlEl = root.querySelector('div.prose') as HTMLDivElement | null
      if (htmlEl && html)
        htmlEl.innerHTML = html
    }

    function applyInlineArrowPlacement(p: ElectronTooltipPlacement) {
      if (!inlineRoot)
        return
      const wrap = inlineRoot.querySelector('[data-et-arrow-wrap="1"]') as HTMLElement | null
      const svg = inlineRoot.querySelector('[data-et-arrow-svg="1"]') as SVGElement | null
      const path = inlineRoot.querySelector('[data-et-arrow-path="1"]') as SVGPathElement | null
      if (!wrap || !svg || !path)
        return

      wrap.classList.remove(
        'left-1/2',
        '-translate-x-1/2',
        '-bottom-[6px]',
        '-top-[6px]',
        '-left-[6px]',
        '-right-[6px]',
        'top-1/2',
        '-translate-y-1/2',
      )

      const setSvg = (spec: { width: number, height: number, viewBox: string, d: string }) => {
        svg.setAttribute('width', String(spec.width))
        svg.setAttribute('height', String(spec.height))
        svg.setAttribute('viewBox', spec.viewBox)
        path.setAttribute('d', spec.d)
      }

      if (p === 'top') {
        wrap.classList.add('left-1/2', '-translate-x-1/2', '-bottom-[6px]')
        setSvg({ width: 12, height: 6, viewBox: '0 0 12 6', d: 'M0 0L6 6L12 0Z' })
      }
      else if (p === 'bottom') {
        wrap.classList.add('left-1/2', '-translate-x-1/2', '-top-[6px]')
        setSvg({ width: 12, height: 6, viewBox: '0 0 12 6', d: 'M0 6L6 0L12 6Z' })
      }
      else if (p === 'left') {
        wrap.classList.add('-right-[6px]', 'top-1/2', '-translate-y-1/2')
        setSvg({ width: 6, height: 12, viewBox: '0 0 6 12', d: 'M0 0L6 6L0 12Z' })
      }
      else {
        wrap.classList.add('-left-[6px]', 'top-1/2', '-translate-y-1/2')
        setSvg({ width: 6, height: 12, viewBox: '0 0 6 12', d: 'M6 0L0 6L6 12Z' })
      }
    }

    function measureInlineSize() {
      if (!inlineRoot)
        return { width: 0, height: 0 }
      const first = inlineRoot.firstElementChild as HTMLElement | null
      if (!first)
        return { width: 0, height: 0 }
      // Temporarily move off-screen to measure without visible jumps.
      const prevOpacity = inlineRoot.style.opacity
      const prevTransform = inlineRoot.style.transform
      inlineRoot.style.opacity = '0'
      inlineRoot.style.transform = 'translate(-99999px, -99999px)'
      const rect = first.getBoundingClientRect()
      inlineRoot.style.opacity = prevOpacity
      inlineRoot.style.transform = prevTransform
      return { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }
    }

    function positionInline() {
      if (!inlineRoot)
        return
      const anchor = getAnchorRect(el)
      const size = measureInlineSize()
      if (size.width <= 0 || size.height <= 0)
        return

      const preferred = options.placement ?? 'top'
      const offset = options.offset ?? 10
      const pos = computeInlineBestPosition({ anchor, tooltip: size, preferred, offset })
      applyInlineArrowPlacement(pos.placement)
      inlineRoot.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      inlineRoot.style.opacity = '1'
    }

    const showInline = () => {
      inlineAnchorHovered = true
      cancelInlineHide()
      setInlineContent()
      positionInline()
    }

    const hideInlineFromAnchorLeave = () => {
      inlineAnchorHovered = false
      scheduleInlineHide()
    }

    const forceHideInline = () => {
      inlineAnchorHovered = false
      inlineTooltipHovered = false
      clearInlineRoot()
    }

    const detachUpdateListenersSoon = () => {
      if (leaveCleanupTimer)
        window.clearTimeout(leaveCleanupTimer)
      leaveCleanupTimer = window.setTimeout(() => {
        leaveCleanupTimer = null
        cleanupUpdateListeners?.()
        cleanupUpdateListeners = null
      }, 250)
    }

    const onEnter = () => {
      if (options.disabled)
        return

      const text = options.text
      const html = options.html
      if (!text && !html)
        return

      if (leaveCleanupTimer) {
        window.clearTimeout(leaveCleanupTimer)
        leaveCleanupTimer = null
      }

      void (async () => {
        // On macOS fullscreen, detached tooltip windows can cause Space switches / flicker.
        // In that case, degrade to an in-renderer tooltip overlay.
        if (isMac() && (await isFullScreenWindow())) {
          mode = 'inline'
          if (activeId) {
            window.invoke('tooltipHide', { id: activeId })
            activeId = null
          }
          attachUpdateListeners()
          showInline()
          return
        }

        mode = 'detached'
        forceHideInline()

        activeId = makeId()
        attachUpdateListeners()

        window.invoke('tooltipShow', {
          id: activeId,
          anchorRect: getAnchorRect(el),
          content: {
            text,
            html,
            maxWidth: options.maxWidth,
          },
          placement: options.placement,
          offset: options.offset,
        })
      })()
    }

    const onLeave = () => {
      if (mode === 'inline') {
        hideInlineFromAnchorLeave()
        detachUpdateListenersSoon()
        return
      }
      if (!activeId)
        return
      window.invoke('tooltipHide', { id: activeId })
      detachUpdateListenersSoon()
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)

    stateMap.set(el, {
      getActiveId: () => activeId,
      setActiveId: (id) => {
        activeId = id
      },
      getOptions: () => options,
      setOptions: (o) => {
        options = o
      },
      updatePosition,
      attachUpdateListeners,
      setMode: (m) => {
        mode = m
      },
      getMode: () => mode,
      showInline,
      hideInlineFromAnchorLeave,
      forceHideInline,
    })

    cleanupMap.set(el, () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (leaveCleanupTimer)
        window.clearTimeout(leaveCleanupTimer)
      cleanupUpdateListeners?.()
      cleanupUpdateListeners = null
      forceHideInline()
      if (activeId && mode === 'detached')
        window.invoke('tooltipHide', { id: activeId })
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
      state.forceHideInline()
      if (id)
        window.invoke('tooltipHide', { id })
      return
    }

    if (state.getMode() === 'inline') {
      if (el.matches(':hover'))
        state.showInline()
      state.updatePosition()
      return
    }

    if (!id)
      return

    const text = options.text
    const html = options.html
    if (!text && !html)
      return

    state.attachUpdateListeners()
    window.invoke('tooltipShow', {
      id,
      anchorRect: getAnchorRect(el),
      content: { text, html, maxWidth: options.maxWidth },
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
