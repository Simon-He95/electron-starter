export { ELECTRON_TOOLTIP_CHANNELS, ELECTRON_TOOLTIP_EVENTS } from './channels.js'
export type { ElectronTooltipChannel, ElectronTooltipEvent } from './channels.js'

export * from './schemas.js'

export { ElectronTooltipManager } from './main/TooltipManager.js'
export { createElectronTooltipIpcHandlers } from './main/createIpcHandlers.js'

export {
  createElectronTooltipDirective,
  vElectronTooltip,
} from './renderer/vueDirective.js'
export type {
  ElectronTooltipBindingValue,
  ElectronTooltipBridge,
  ElectronTooltipPlacement,
  CreateElectronTooltipDirectiveOptions,
} from './renderer/vueDirective.js'

export { createElectronTooltipWindowClient } from './renderer/windowClient.js'
export type {
  CreateElectronTooltipWindowClientOptions,
  ElectronTooltipWindowBridge,
  ElectronTooltipWindowClient,
  TooltipWindowState,
} from './renderer/windowClient.js'
