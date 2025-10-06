import { beforeEach, describe, expect, it, vi } from 'vitest'

// We'll mock the createWindow module and electron so importing main/index.ts
// will register the closed listener on our mocked main window.

const listeners: Record<string, (...args: any[]) => void> = {}

// mock the createWindow module
const destroySpy = vi.fn()
vi.mock('../src/main/listener/createWindow', async () => {
  return {
    createWindow: () => ({
      on: (ev: string, cb: (...args: any[]) => void) => {
        listeners[ev] = cb
      },
    }),
    destroyAllTrackedWindows: destroySpy,
  }
})

// mock electron and a few other imports used in main/index.ts
vi.mock('electron', async () => {
  return {
    app: {
      whenReady: () => Promise.resolve(),
      on: vi.fn(),
    },
    BrowserWindow: {
      getAllWindows: () => [],
    },
    ipcMain: {
      handle: vi.fn(),
    },
  }
})

vi.mock('@electron-toolkit/utils', () => ({
  electronApp: { setAppUserModelId: vi.fn() },
  optimizer: { watchWindowShortcuts: vi.fn() },
}))

// We also mock the ipcListener module to avoid side effects when registering handlers
vi.mock('../src/main/listener/index', () => ({ ipcListener: {} }))

describe('main/index cleanup wiring', () => {
  beforeEach(() => {
    destroySpy.mockReset()
    for (const k of Object.keys(listeners)) delete listeners[k]
  })

  it('registers closed listener and calls destroyAllTrackedWindows on main close', async () => {
    // import the module under test after mocks are in place
    await import('../src/main/index')

    // ensure the closed listener was registered
    expect(typeof listeners.closed).toBe('function')

    // simulate main window being closed
    listeners.closed()

    expect(destroySpy).toHaveBeenCalled()
  })
})
