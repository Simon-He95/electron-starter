import { vi } from 'vitest'

export class MockBrowserWindow {
  static instances: MockBrowserWindow[] = []
  static getAllWindows() {
    return MockBrowserWindow.instances
  }

  static getFocusedWindow() {
    return MockBrowserWindow.instances[0] || null
  }

  id: number
  _events: Record<string, ((...args: any[]) => void)[]> = {}
  _bounds = { x: 0, y: 0, width: 100, height: 100 }
  webContents: any

  constructor(_opts?: any) {
    this.id = MockBrowserWindow.instances.length + 1
    this.webContents = { setWindowOpenHandler: vi.fn(), loadURL: vi.fn(), on: vi.fn() }
    MockBrowserWindow.instances.push(this)
  }

  on(event: string, cb: (...args: any[]) => void) {
    this._events[event] = this._events[event] || []
    this._events[event].push(cb)
  }

  emit(event: string, ...args: any[]) {
    ;(this._events[event] || []).forEach(cb => cb(...args))
  }

  show = vi.fn()
  removeAllListeners() {
    this._events = {}
  }

  isDestroyed() {
    return false
  }

  destroy = vi.fn()
  getBounds() {
    return { ...this._bounds }
  }

  setBounds(b: any) {
    this._bounds = { ...this._bounds, ...b }
  }

  setPosition(x: number, y: number) {
    this._bounds.x = x
    this._bounds.y = y
  }

  setOpacity(_n: number) {}
}

// Register mocks at module load time so Vitest hoisting won't import the
// actual 'electron' CJS module as named exports during test collection.
vi.mock('../src/main/index.js', () => ({
  context: {
    windows: {
      map: new Map<string, any>(),
      openLinksExternal: true,
    },
  },
}))

vi.mock('electron', () => {
  // Provide both a default export and named exports so ESM imports
  // (named or default) work correctly in the test environment.
  const mockModule = {
    __esModule: true,
    default: {
      BrowserWindow: MockBrowserWindow as any,
      screen: { getDisplayMatching: () => ({ bounds: { x: 0, width: 1024 } }) },
      shell: { openExternal: vi.fn() },
      app: { whenReady: () => Promise.resolve(), on: vi.fn() },
      ipcMain: { handle: vi.fn() },
    },
    // also provide named exports for code that does `import electron from 'electron'` and then destructures
    BrowserWindow: MockBrowserWindow as any,
    screen: { getDisplayMatching: () => ({ bounds: { x: 0, width: 1024 } }) },
    shell: { openExternal: vi.fn() },
    app: { whenReady: () => Promise.resolve(), on: vi.fn() },
    ipcMain: { handle: vi.fn() },
  }
  return mockModule
})

vi.mock('lazy-js-utils', () => ({
  useInterval: (cb: any, ms: number) => {
    const id = setInterval(cb, ms)
    return { pause: () => clearInterval(id) }
  },
}))

export function applyCommonMocks() {
  // kept for compatibility with tests that call this explicitly
}

export function resetMocks() {
  MockBrowserWindow.instances = []
}
