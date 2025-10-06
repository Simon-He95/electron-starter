import { expect, it } from 'vitest'
import { CreateWindowSchema, UpdateWindowBoundsSchema } from '../src/shared/schemas'

it('createWindowSchema accepts valid payload and rejects invalid', () => {
  const valid = {
    windowConfig: { width: 400, height: 300, title: 'ok' },
    hashRoute: '_demo',
    type: 'center',
  }
  expect(() => CreateWindowSchema.parse(valid)).not.toThrow()

  const invalid = { windowConfig: { width: '400px' } }
  expect(() => CreateWindowSchema.parse(invalid)).toThrow()
})

it('updateWindowBoundsSchema validates correctly', () => {
  const valid = { id: 'win-1', bounds: { width: 200 } }
  expect(() => UpdateWindowBoundsSchema.parse(valid)).not.toThrow()

  const invalid = { id: 123, bounds: { width: 'x' } }
  expect(() => UpdateWindowBoundsSchema.parse(invalid)).toThrow()
})
