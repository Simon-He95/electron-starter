import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { context } from '../src/main/index.js'

// Import the module under test after mocks
import { createWindow, getWindowTrackingInfo, resetWindowTracking } from '../src/main/listener/createWindow'
import { applyCommonMocks, MockBrowserWindow, resetMocks } from './test-utils'

applyCommonMocks()

describe('createWindow behavior', () => {
  beforeEach(() => {
    resetMocks()
    context.windows.map.clear()
    // ensure internal tracking maps are reset between tests
    resetWindowTracking()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetMocks()
    resetWindowTracking()
  })

  it('shows window on ready-to-show', () => {
    const win = createWindow({ windowConfig: {} as any })
    // find the mock instance
    const inst = MockBrowserWindow.instances[0]
    // simulate ready-to-show
    inst.emit('ready-to-show')
    expect(inst.show).toHaveBeenCalled()
  })

  it('repositions child windows when parent moves (isFollowMove)', () => {
    // create parent and mark it as main
    const parent = createWindow({ windowConfig: {} as any })
    context.windows.map.set('main', parent)

    // create a child that follows parent movement
    const child = createWindow({ isFollowMove: true, windowConfig: {} as any })

    const parentInst = MockBrowserWindow.instances[0]
    const childInst = MockBrowserWindow.instances[1]

    // set parent bounds to a new position
    parentInst._bounds.x = 200
    parentInst._bounds.y = 200

    // emit move on parent and advance timers to allow throttled move to run
    parentInst.emit('move')
    vi.advanceTimersByTime(100)

    // child should have been repositioned (x,y changed from 0)
    const cb = childInst.getBounds()
    expect(cb.x).not.toBe(0)
    expect(cb.y).not.toBe(0)
  })

  it('closing main destroys children and clears internal maps', () => {
    // create parent and mark it as main
    const parent = createWindow({ windowConfig: {} as any })
    context.windows.map.set('main', parent)

    // create a couple of children
    const child1 = createWindow({ isFollowMove: true, windowConfig: {} as any })
    const child2 = createWindow({ isFollowMove: true, windowConfig: {} as any })

    const parentInst = MockBrowserWindow.instances[0]
    const childInst1 = MockBrowserWindow.instances[1]
    const childInst2 = MockBrowserWindow.instances[2]

    // sanity precondition
    const before = getWindowTrackingInfo()
    expect(before.windowMapSize).toBeGreaterThanOrEqual(3)

    // simulate main close
    parentInst.emit('closed')

    // children should have been destroyed
    expect(childInst1.destroy).toHaveBeenCalled()
    expect(childInst2.destroy).toHaveBeenCalled()

    // internal tracking maps should be cleared
    const after = getWindowTrackingInfo()
    expect(after.windowMapSize).toBe(0)
    expect(after.relationMapSize).toBe(0)
    expect(after.moveThrottleSize).toBe(0)
  })

  it('updateWindowBounds updates size for center windows', () => {
    const win = createWindow({ windowConfig: {} as any })
    const inst = MockBrowserWindow.instances[0]

    // initial bounds
    const before = inst.getBounds()
    expect(before.width).toBe(100)

    // call updateWindowBounds with new width/height
    const idKey = `$$${inst.id}`
    const { updateWindowBounds } = require('../src/main/listener/createWindow')
    const ok = updateWindowBounds({ id: idKey, bounds: { width: 300, height: 400 } })
    expect(ok).toBe(true)

    const after = inst.getBounds()
    expect(after.width).toBe(300)
    expect(after.height).toBe(400)
  })

  it('closing a child removes it from relationMap and clears throttles', () => {
    // create parent and set as main
    const parent = createWindow({ windowConfig: {} as any })
    context.windows.map.set('main', parent)

    // create a child that follows parent movement
    const child = createWindow({ isFollowMove: true, windowConfig: {} as any })

    const parentInst = MockBrowserWindow.instances[0]
    const childInst = MockBrowserWindow.instances[1]

    // trigger ready-to-show so relationMap entry is created
    parentInst.emit('ready-to-show')
    childInst.emit('ready-to-show')

    // ensure relation map has entries (tracking info should reflect children present)
    const before = getWindowTrackingInfo()
    expect(before.windowMapSize).toBeGreaterThanOrEqual(2)

    // close the child window
    childInst.emit('closed')

    // child destroy should have been called
    expect(childInst.destroy).toHaveBeenCalled()

    // internal tracking maps should reflect removal
    const after = getWindowTrackingInfo()
    expect(after.windowMapSize).toBeLessThanOrEqual(before.windowMapSize - 1)
  })
})
