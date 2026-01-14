import { z } from 'zod'

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
export const GetCurrentWindowStateSchema = z.undefined()

const TooltipPlacementSchema = z.union([z.literal('top'), z.literal('bottom'), z.literal('left'), z.literal('right')])

export const TooltipAnchorRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

export const TooltipContentSchema = z
  .object({
    text: z.string().optional(),
    html: z.string().optional(),
    maxWidth: z.number().optional(),
  })
  .refine(v => !!(v.text || v.html), { message: 'Tooltip content must include text or html' })

export const TooltipShowSchema = z.object({
  id: z.string(),
  anchorRect: TooltipAnchorRectSchema,
  content: TooltipContentSchema,
  placement: TooltipPlacementSchema.optional(),
  offset: z.number().optional(),
})

export const TooltipUpdateAnchorRectSchema = z.object({
  id: z.string(),
  anchorRect: TooltipAnchorRectSchema,
})

export const TooltipHideSchema = z.object({ id: z.string() })
export const TooltipForceHideSchema = z.undefined()

export const TooltipReportSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
})

export const TooltipSetTooltipHoveredSchema = z.boolean()
export const TooltipRendererReadySchema = z.undefined()

export const schemaMap: Record<string, z.ZodTypeAny> = {
  createWindow: CreateWindowSchema,
  updateWindowBounds: UpdateWindowBoundsSchema,
}

// add lightweight schemas
schemaMap.ping = PingSchema
schemaMap.getOpenLinksExternal = GetOpenLinksExternalSchema
schemaMap.updateOpenLinksExternal = UpdateOpenLinksExternalSchema
schemaMap.getCurrentWindowState = GetCurrentWindowStateSchema
schemaMap.tooltipShow = TooltipShowSchema
schemaMap.tooltipUpdateAnchorRect = TooltipUpdateAnchorRectSchema
schemaMap.tooltipHide = TooltipHideSchema
schemaMap.tooltipForceHide = TooltipForceHideSchema
schemaMap.tooltipReportSize = TooltipReportSizeSchema
schemaMap.tooltipSetTooltipHovered = TooltipSetTooltipHoveredSchema
schemaMap.tooltipRendererReady = TooltipRendererReadySchema

export default schemaMap

// Export inferred TypeScript types from zod schemas
export type CreateWindowInput = z.infer<typeof CreateWindowSchema>
export type UpdateWindowBoundsInput = z.infer<typeof UpdateWindowBoundsSchema>

export type PingInput = z.infer<typeof PingSchema>
export type GetOpenLinksExternalInput = z.infer<typeof GetOpenLinksExternalSchema>
export type UpdateOpenLinksExternalInput = z.infer<typeof UpdateOpenLinksExternalSchema>
export type GetCurrentWindowStateInput = z.infer<typeof GetCurrentWindowStateSchema>
export type TooltipShowInput = z.infer<typeof TooltipShowSchema>
export type TooltipUpdateAnchorRectInput = z.infer<typeof TooltipUpdateAnchorRectSchema>
export type TooltipHideInput = z.infer<typeof TooltipHideSchema>
export type TooltipForceHideInput = z.infer<typeof TooltipForceHideSchema>
export type TooltipReportSizeInput = z.infer<typeof TooltipReportSizeSchema>
export type TooltipSetTooltipHoveredInput = z.infer<typeof TooltipSetTooltipHoveredSchema>
export type TooltipRendererReadyInput = z.infer<typeof TooltipRendererReadySchema>

// Central mapping of channel -> input type (used by main & renderer for consistent typing)
export interface SchemaInputs {
  createWindow: CreateWindowInput
  updateWindowBounds: UpdateWindowBoundsInput
  ping: PingInput
  getOpenLinksExternal: GetOpenLinksExternalInput
  updateOpenLinksExternal: UpdateOpenLinksExternalInput
  getCurrentWindowState: GetCurrentWindowStateInput
  tooltipShow: TooltipShowInput
  tooltipUpdateAnchorRect: TooltipUpdateAnchorRectInput
  tooltipHide: TooltipHideInput
  tooltipForceHide: TooltipForceHideInput
  tooltipReportSize: TooltipReportSizeInput
  tooltipSetTooltipHovered: TooltipSetTooltipHoveredInput
  tooltipRendererReady: TooltipRendererReadyInput
}

// Event schemas for messages sent from main -> renderer (ipcRenderer.on)
export const WindowBlurSchema = z.object({ hashRoute: z.string().optional(), id: z.number() })
export const TooltipSetSchema = z.object({
  content: TooltipContentSchema,
  placement: TooltipPlacementSchema,
  maxWidth: z.number().optional(),
})

export const eventSchemaMap: Record<string, z.ZodTypeAny> = {
  'window-blur': WindowBlurSchema,
  'tooltip-set': TooltipSetSchema,
}

export type WindowBlurPayload = z.infer<typeof WindowBlurSchema>
export type TooltipSetPayload = z.infer<typeof TooltipSetSchema>
