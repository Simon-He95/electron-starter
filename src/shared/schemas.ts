import { z } from 'zod'
import {
  tooltipEventSchemaMap,
  tooltipSchemaMap,
  type TooltipSchemaInputs,
} from '../plugins/electron-tooltip/schemas.js'
export {
  GetCurrentWindowStateSchema,
  TooltipAnchorRectSchema,
  TooltipContentSchema,
  TooltipCloseSchema,
  TooltipForceHideSchema,
  TooltipHideSchema,
  TooltipRendererReadySchema,
  TooltipReportSizeSchema,
  TooltipSetSchema,
  TooltipSetPinnedSchema,
  TooltipSetTooltipHoveredSchema,
  TooltipShowSchema,
  TooltipUpdateAnchorRectSchema,
} from '../plugins/electron-tooltip/schemas.js'
export type {
  GetCurrentWindowStateInput,
  TooltipCloseInput,
  TooltipForceHideInput,
  TooltipHideInput,
  TooltipRendererReadyInput,
  TooltipReportSizeInput,
  TooltipSetPayload,
  TooltipSetPinnedInput,
  TooltipSetTooltipHoveredInput,
  TooltipShowInput,
  TooltipUpdateAnchorRectInput,
} from '../plugins/electron-tooltip/schemas.js'

export const CreateWindowSchema = z
  .object({
    bound: z
      .object({
        height: z.number().optional(),
        width: z.number().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
      })
      .optional(),
    exportName: z.string().optional(),
    hashRoute: z.string().optional(),
    isFollowMove: z.boolean().optional(),
    params: z.record(z.string(), z.any()).optional(),
    type: z
      .union([
        z.literal('left-top-in'),
        z.literal('left-top-out'),
        z.literal('right-top-in'),
        z.literal('right-top-out'),
        z.literal('left-bottom-in'),
        z.literal('left-bottom-out'),
        z.literal('right-bottom-in'),
        z.literal('right-bottom-out'),
        z.literal('center'),
      ])
      .optional(),
    // Provide a more precise shape for common BrowserWindow options while still allowing
    // additional passthrough properties (webPreferences and positional keys are omitted).
    windowConfig: z
      .object({
        alwaysOnTop: z.boolean().optional(),
        frame: z.boolean().optional(),
        fullscreenable: z.boolean().optional(),
        height: z.number().optional(),
        maximizable: z.boolean().optional(),
        minimizable: z.boolean().optional(),
        movable: z.boolean().optional(),
        resizable: z.boolean().optional(),
        show: z.boolean().optional(),
        skipTaskbar: z.boolean().optional(),
        title: z.string().optional(),
        transparent: z.boolean().optional(),
        width: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export const UpdateWindowBoundsSchema = z.object({
  bounds: z.object({ height: z.number().optional(), width: z.number().optional() }),
  id: z.string(),
})

export const PingSchema = z.undefined()
export const GetOpenLinksExternalSchema = z.undefined()
export const UpdateOpenLinksExternalSchema = z.boolean()

export const schemaMap: Record<string, z.ZodTypeAny> = {
  createWindow: CreateWindowSchema,
  updateWindowBounds: UpdateWindowBoundsSchema,
}

// add lightweight schemas
schemaMap.ping = PingSchema
schemaMap.getOpenLinksExternal = GetOpenLinksExternalSchema
schemaMap.updateOpenLinksExternal = UpdateOpenLinksExternalSchema
Object.assign(schemaMap, tooltipSchemaMap)

export default schemaMap

// Export inferred TypeScript types from zod schemas
export type CreateWindowInput = z.infer<typeof CreateWindowSchema>
export type UpdateWindowBoundsInput = z.infer<typeof UpdateWindowBoundsSchema>

export type PingInput = z.infer<typeof PingSchema>
export type GetOpenLinksExternalInput = z.infer<typeof GetOpenLinksExternalSchema>
export type UpdateOpenLinksExternalInput = z.infer<typeof UpdateOpenLinksExternalSchema>

// Central mapping of channel -> input type (used by main & renderer for consistent typing)
export interface SchemaInputs extends TooltipSchemaInputs {
  createWindow: CreateWindowInput
  updateWindowBounds: UpdateWindowBoundsInput
  ping: PingInput
  getOpenLinksExternal: GetOpenLinksExternalInput
  updateOpenLinksExternal: UpdateOpenLinksExternalInput
}

// Event schemas for messages sent from main -> renderer (ipcRenderer.on)
export const WindowBlurSchema = z.object({ hashRoute: z.string().optional(), id: z.number() })

export const eventSchemaMap: Record<string, z.ZodTypeAny> = {
  'window-blur': WindowBlurSchema,
  ...tooltipEventSchemaMap,
}

export type WindowBlurPayload = z.infer<typeof WindowBlurSchema>
