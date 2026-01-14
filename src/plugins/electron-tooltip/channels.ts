export const ELECTRON_TOOLTIP_CHANNELS = {
  getCurrentWindowState: 'getCurrentWindowState',
  tooltipClose: 'tooltipClose',
  tooltipForceHide: 'tooltipForceHide',
  tooltipHide: 'tooltipHide',
  tooltipRendererReady: 'tooltipRendererReady',
  tooltipReportSize: 'tooltipReportSize',
  tooltipSetPinned: 'tooltipSetPinned',
  tooltipSetTooltipHovered: 'tooltipSetTooltipHovered',
  tooltipShow: 'tooltipShow',
  tooltipUpdateAnchorRect: 'tooltipUpdateAnchorRect',
} as const

export type ElectronTooltipChannel = (typeof ELECTRON_TOOLTIP_CHANNELS)[keyof typeof ELECTRON_TOOLTIP_CHANNELS]

export const ELECTRON_TOOLTIP_EVENTS = {
  tooltipSet: 'tooltip-set',
} as const

export type ElectronTooltipEvent = (typeof ELECTRON_TOOLTIP_EVENTS)[keyof typeof ELECTRON_TOOLTIP_EVENTS]
