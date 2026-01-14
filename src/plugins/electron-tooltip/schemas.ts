import { z } from 'zod'

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
    component: z
      .object({
        name: z.string(),
        props: z.record(z.string(), z.any()).optional(),
      })
      .optional(),
    maxWidth: z.number().optional(),
  })
  .refine(v => !!(v.text || v.html || v.component), { message: 'Tooltip content must include text, html, or component' })

export const TooltipShowSchema = z.object({
  id: z.string(),
  anchorRect: TooltipAnchorRectSchema,
  content: TooltipContentSchema,
  placement: TooltipPlacementSchema.optional(),
  offset: z.number().optional(),
  behavior: z.union([z.literal('hover'), z.literal('manual')]).optional(),
})

export const TooltipUpdateAnchorRectSchema = z.object({
  id: z.string(),
  anchorRect: TooltipAnchorRectSchema,
})

export const TooltipHideSchema = z.object({ id: z.string() })
export const TooltipForceHideSchema = z.undefined()
export const TooltipCloseSchema = z.object({ id: z.string() })

export const TooltipReportSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
})

export const TooltipSetTooltipHoveredSchema = z.boolean()
export const TooltipRendererReadySchema = z.undefined()
export const TooltipSetPinnedSchema = z.object({ id: z.string(), pinned: z.boolean() })

export const GetCurrentWindowStateSchema = z.undefined()

export const TooltipSetSchema = z.object({
  id: z.string(),
  content: TooltipContentSchema,
  placement: TooltipPlacementSchema,
  behavior: z.union([z.literal('hover'), z.literal('manual')]).optional(),
  maxWidth: z.number().optional(),
})

export type TooltipShowInput = z.infer<typeof TooltipShowSchema>
export type TooltipUpdateAnchorRectInput = z.infer<typeof TooltipUpdateAnchorRectSchema>
export type TooltipHideInput = z.infer<typeof TooltipHideSchema>
export type TooltipForceHideInput = z.infer<typeof TooltipForceHideSchema>
export type TooltipCloseInput = z.infer<typeof TooltipCloseSchema>
export type TooltipReportSizeInput = z.infer<typeof TooltipReportSizeSchema>
export type TooltipSetTooltipHoveredInput = z.infer<typeof TooltipSetTooltipHoveredSchema>
export type TooltipRendererReadyInput = z.infer<typeof TooltipRendererReadySchema>
export type TooltipSetPinnedInput = z.infer<typeof TooltipSetPinnedSchema>
export type GetCurrentWindowStateInput = z.infer<typeof GetCurrentWindowStateSchema>
export type TooltipSetPayload = z.infer<typeof TooltipSetSchema>

export interface TooltipSchemaInputs {
  getCurrentWindowState: GetCurrentWindowStateInput
  tooltipShow: TooltipShowInput
  tooltipUpdateAnchorRect: TooltipUpdateAnchorRectInput
  tooltipHide: TooltipHideInput
  tooltipForceHide: TooltipForceHideInput
  tooltipClose: TooltipCloseInput
  tooltipReportSize: TooltipReportSizeInput
  tooltipSetTooltipHovered: TooltipSetTooltipHoveredInput
  tooltipRendererReady: TooltipRendererReadyInput
  tooltipSetPinned: TooltipSetPinnedInput
}

export const tooltipSchemaMap: Record<string, z.ZodTypeAny> = {
  getCurrentWindowState: GetCurrentWindowStateSchema,
  tooltipShow: TooltipShowSchema,
  tooltipUpdateAnchorRect: TooltipUpdateAnchorRectSchema,
  tooltipHide: TooltipHideSchema,
  tooltipForceHide: TooltipForceHideSchema,
  tooltipClose: TooltipCloseSchema,
  tooltipReportSize: TooltipReportSizeSchema,
  tooltipSetTooltipHovered: TooltipSetTooltipHoveredSchema,
  tooltipRendererReady: TooltipRendererReadySchema,
  tooltipSetPinned: TooltipSetPinnedSchema,
}

export const tooltipEventSchemaMap: Record<string, z.ZodTypeAny> = {
  'tooltip-set': TooltipSetSchema,
}
