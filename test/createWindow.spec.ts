import { describe, expect, it } from 'vitest'
import { CreateWindowSchema } from '../src/shared/schemas'

describe('createWindowSchema', () => {
  it('accepts minimal payloads', () => {
    expect(() => CreateWindowSchema.parse({})).not.toThrow()
  })

  it('accepts windowConfig with known keys', () => {
    const payload = { windowConfig: { width: 800, height: 600, title: 'Test' } }
    expect(() => CreateWindowSchema.parse(payload)).not.toThrow()
  })

  it('allows passthrough extra keys', () => {
    const payload = { custom: { foo: 'bar' }, windowConfig: { width: 200 } }
    const parsed = CreateWindowSchema.parse(payload)
    // passthrough should preserve unknown keys
    // runtime check of passthrough property
    // @ts-ignore
    expect(parsed.custom).toEqual({ foo: 'bar' })
  })

  it('rejects wrong types', () => {
    const bad = { windowConfig: { width: 'wide' } }
    expect(() => CreateWindowSchema.parse(bad)).toThrow()
  })
})
