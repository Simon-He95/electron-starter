import { z } from 'zod'

// Re-declare the schemas in JS so we can run a runtime check without compiling TS.
export const CreateWindowSchema = z
  .object({
    windowConfig: z
      .object({
        width: z.number().optional(),
        height: z.number().optional(),
        title: z.string().optional(),
        frame: z.boolean().optional(),
        resizable: z.boolean().optional(),
        movable: z.boolean().optional(),
        minimizable: z.boolean().optional(),
        maximizable: z.boolean().optional(),
        fullscreenable: z.boolean().optional(),
        show: z.boolean().optional(),
        transparent: z.boolean().optional(),
        alwaysOnTop: z.boolean().optional(),
        skipTaskbar: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
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
    bound: z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
      .optional(),
    hashRoute: z.string().optional(),
    isFollowMove: z.boolean().optional(),
    exportName: z.string().optional(),
  })
  .passthrough()

export const UpdateWindowBoundsSchema = z.object({
  id: z.string(),
  bounds: z.object({ width: z.number().optional(), height: z.number().optional() }),
})

function runTest() {
  const validCW = {
    windowConfig: { width: 400, height: 300, title: 'ok' },
    hashRoute: '_demo',
    type: 'center',
  }

  const invalidCW = {
    windowConfig: { width: '400px' }, // invalid type
    hashRoute: '_demo',
  }

  const validUB = { id: 'win-1', bounds: { width: 200 } }
  const invalidUB = { id: 123, bounds: { width: 'x' } }

  try {
    CreateWindowSchema.parse(validCW)
    console.log('CreateWindowSchema: valid payload passed')
  }
  catch (e) {
    console.error('CreateWindowSchema: valid payload failed', e)
    process.exitCode = 2
  }

  try {
    CreateWindowSchema.parse(invalidCW)
    console.error('CreateWindowSchema: invalid payload unexpectedly passed')
    process.exitCode = 3
  }
  catch (e) {
    console.log('CreateWindowSchema: invalid payload correctly rejected')
  }

  try {
    UpdateWindowBoundsSchema.parse(validUB)
    console.log('UpdateWindowBoundsSchema: valid payload passed')
  }
  catch (e) {
    console.error('UpdateWindowBoundsSchema: valid payload failed', e)
    process.exitCode = 4
  }

  try {
    UpdateWindowBoundsSchema.parse(invalidUB)
    console.error('UpdateWindowBoundsSchema: invalid payload unexpectedly passed')
    process.exitCode = 5
  }
  catch (e) {
    console.log('UpdateWindowBoundsSchema: invalid payload correctly rejected')
  }

  if (!process.exitCode)
    process.exitCode = 0
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('test-schema.mjs')) {
  runTest()
}
