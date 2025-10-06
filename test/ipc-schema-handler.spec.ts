import { describe, expect, it, vi } from 'vitest'

import { ipcListener } from '../src/main/listener/index.js'
// Import after mocks are in place
import schemaMap from '../src/shared/schemas.js'

// Mock the app context and createWindow to avoid loading electron during this test
vi.mock('../src/main/index.js', () => ({
  context: {
    windows: {
      map: new Map<string, any>(),
      openLinksExternal: true,
    },
  },
}))

vi.mock('../src/main/listener/createWindow', () => ({
  createWindow: vi.fn(),
  updateWindowBounds: vi.fn(),
}))

describe('iPC schema vs handler parity', () => {
  it('ensures every schema has a handler implementation', () => {
    const schemaKeys = Object.keys(schemaMap)
    const handlerKeys = Object.keys(ipcListener)

    const missing = schemaKeys.filter(k => !handlerKeys.includes(k))
    expect(missing).toEqual([])
  })
})
