import { beforeEach, describe, expect, it, vi } from 'vitest'

import { destroyAllTrackedWindows, getWindowTrackingInfo } from '../src/main/listener/createWindow'

// We'll mock electron's BrowserWindow.getAllWindows and import the helpers
const mockWindows: any[] = []
vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => mockWindows,
  },
}))

describe('tracking state', () => {
  beforeEach(() => {
    mockWindows.length = 0
  })

  it('clears internal maps after destroyAllTrackedWindows', () => {
    // simulate some tracked keys by pushing a dummy window
    mockWindows.push({ id: 999, removeAllListeners: vi.fn(), isDestroyed: () => false, destroy: vi.fn() })

    // precondition: we don't know internal sizes but ensure function runs
    destroyAllTrackedWindows()

    const info = getWindowTrackingInfo()
    expect(info.windowMapSize).toBe(0)
    expect(info.relationMapSize).toBe(0)
    expect(info.moveThrottleSize).toBe(0)
  })
})
