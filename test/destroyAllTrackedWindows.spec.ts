import { beforeEach, describe, expect, it, vi } from 'vitest'

// Import after mocking electron
import { destroyAllTrackedWindows } from '../src/main/listener/createWindow'

// Prepare a mutable array that our mocked BrowserWindow.getAllWindows will return
const mockWindows: any[] = []

vi.mock('electron', () => {
  return {
    // minimal BrowserWindow mock surface used by createWindow.destroyAllTrackedWindows
    BrowserWindow: {
      getAllWindows: () => mockWindows,
    },
  }
})

function makeMockWindow(id: number) {
  let destroyed = false
  return {
    id,
    removeAllListeners: vi.fn(),
    isDestroyed: () => destroyed,
    destroy: vi.fn(() => {
      destroyed = true
    }),
  }
}

describe('destroyAllTrackedWindows', () => {
  beforeEach(() => {
    mockWindows.length = 0
  })

  it('destroys all windows and removes listeners', () => {
    const w1 = makeMockWindow(1)
    const w2 = makeMockWindow(2)
    const w3 = makeMockWindow(3)

    mockWindows.push(w1, w2, w3)

    // call the cleanup
    destroyAllTrackedWindows()

    // each mock should have had its listeners removed and destroy invoked
    expect(w1.removeAllListeners).toHaveBeenCalled()
    expect(w2.removeAllListeners).toHaveBeenCalled()
    expect(w3.removeAllListeners).toHaveBeenCalled()

    expect(w1.destroy).toHaveBeenCalled()
    expect(w2.destroy).toHaveBeenCalled()
    expect(w3.destroy).toHaveBeenCalled()
  })
})
