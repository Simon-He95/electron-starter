import { createElectronTooltipDirective } from '../../../plugins/electron-tooltip/renderer/vueDirective'

export const vElectronTooltip = createElectronTooltipDirective()

export { createElectronTooltipDirective } from '../../../plugins/electron-tooltip/renderer/vueDirective'
export type {
  ElectronTooltipBindingValue,
  ElectronTooltipBridge,
  ElectronTooltipPlacement,
} from '../../../plugins/electron-tooltip/renderer/vueDirective'
