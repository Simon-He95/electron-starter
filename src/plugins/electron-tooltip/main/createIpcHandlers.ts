import type { IpcMainInvokeEvent } from 'electron'
import electron from 'electron'
import type {
  TooltipCloseInput,
  TooltipHideInput,
  TooltipReportSizeInput,
  TooltipSetPinnedInput,
  TooltipShowInput,
  TooltipUpdateAnchorRectInput,
} from '../schemas.js'
import type { ElectronTooltipManager } from './TooltipManager.js'

const { BrowserWindow } = electron as any

export function createElectronTooltipIpcHandlers(manager: ElectronTooltipManager) {
  return {
    getCurrentWindowState: (event: IpcMainInvokeEvent) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      return { isFullScreen: !!win?.isFullScreen?.() }
    },
    tooltipShow: (event: IpcMainInvokeEvent, params: TooltipShowInput) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win)
        return
      manager.show(win, params)
    },
    tooltipUpdateAnchorRect: (event: IpcMainInvokeEvent, params: TooltipUpdateAnchorRectInput) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win)
        return
      manager.updateAnchorRect(win, params)
    },
    tooltipHide: (_event: IpcMainInvokeEvent, params: TooltipHideInput) => {
      manager.hideFromAnchorLeave(params)
    },
    tooltipClose: (_event: IpcMainInvokeEvent, params: TooltipCloseInput) => {
      manager.close(params)
    },
    tooltipForceHide: () => {
      manager.forceHide()
    },
    tooltipReportSize: (_event: IpcMainInvokeEvent, params: TooltipReportSizeInput) => {
      manager.reportContentSize(params)
    },
    tooltipSetPinned: (_event: IpcMainInvokeEvent, params: TooltipSetPinnedInput) => {
      manager.setPinned(params)
    },
    tooltipSetTooltipHovered: (_event: IpcMainInvokeEvent, hovered: boolean) => {
      manager.setTooltipHovered(hovered)
    },
    tooltipRendererReady: (event: IpcMainInvokeEvent) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win)
        return
      manager.onRendererReady(win)
    },
  }
}
