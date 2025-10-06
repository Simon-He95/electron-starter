import { describe, expect, it } from 'vitest'
import {
  PingSchema,
  UpdateOpenLinksExternalSchema,
  WindowBlurSchema,
} from '../src/shared/schemas'

describe('event & lightweight schemas', () => {
  it('windowBlurSchema accepts valid payloads', () => {
    const valid = { hashRoute: '#/home', id: 42 }
    expect(() => WindowBlurSchema.parse(valid)).not.toThrow()
  })

  it('windowBlurSchema rejects invalid payloads', () => {
    const invalid = { hashRoute: 123, id: 'nope' }
    expect(() => WindowBlurSchema.parse(invalid)).toThrow()
  })

  it('pingSchema is undefined', () => {
    expect(() => PingSchema.parse(undefined)).not.toThrow()
  })

  it('updateOpenLinksExternalSchema accepts boolean', () => {
    expect(() => UpdateOpenLinksExternalSchema.parse(true)).not.toThrow()
    expect(() => UpdateOpenLinksExternalSchema.parse(false)).not.toThrow()
  })

  it('updateOpenLinksExternalSchema rejects non-boolean', () => {
    // runtime invalid input
    // @ts-ignore - intentional runtime test of invalid type
    expect(() => UpdateOpenLinksExternalSchema.parse('yes')).toThrow()
  })
})
