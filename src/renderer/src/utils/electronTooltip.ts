import DemoTooltipCard from '@renderer/components/DemoTooltipCard.vue'
import DemoPopConfirm from '@renderer/components/DemoPopConfirm.vue'
import { createElectronTooltipDirective } from '../../../plugins/electron-tooltip/renderer/vueDirective'

export const vElectronTooltip = createElectronTooltipDirective(undefined, {
  resolveInlineComponent: (name) => {
    if (name === 'DemoTooltipCard')
      return DemoTooltipCard
    if (name === 'DemoPopConfirm')
      return DemoPopConfirm
    return null
  },
})

export { createElectronTooltipDirective } from '../../../plugins/electron-tooltip/renderer/vueDirective'
export type {
  ElectronTooltipBindingValue,
  ElectronTooltipBridge,
  ElectronTooltipPlacement,
  CreateElectronTooltipDirectiveOptions,
} from '../../../plugins/electron-tooltip/renderer/vueDirective'
