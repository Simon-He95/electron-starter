# createWindow API

Location: `src/main/listener/createWindow.ts`

Purpose: create a new BrowserWindow (popup) with a consistent positioning strategy and optional initial params that are passed to the renderer via the URL (query/hash).

Input (WindowOptions) - summary:

- `windowConfig` (Partial<BrowserWindowConstructorOptions>): most BrowserWindow options (the helper does not override `webPreferences` by default)
- `type`: 'center' | 'left-top-in' | 'left-top-out' | 'right-top-in' | 'right-top-out' | 'left-bottom-in' | 'left-bottom-out' | 'right-bottom-in' | 'right-bottom-out' | 'center' — relative position to the parent window
- `bound`?: { x?: number, y?: number, width?: number, height?: number } — optional rectangle used for exact sizing/offset
- `params`?: Record<string, any> — will be serialized and appended to the new window URL
- `hashRoute`?: string — optional hash route to open inside the renderer

Behavior & rules:

- If `parent` is provided (or main process supplies the current mainWindow as parent), positioning is computed relative to the parent's bounds.
- `type === 'center'` centers the new window in the parent bounds.
- Corner types compute an offset from parent's edges using `bound.x` / `bound.y` when provided.
- If `bound.width` or `bound.height` is provided, the window's bounds (size + position) are set accordingly before showing.

Example (renderer):

```ts
await window.invoke('createWindow', {
  windowConfig: { title: 'Right-top popup', parent: window },
  type: 'right-top-in',
  bound: { x: 10, y: 10, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo'
})
```

TypeScript example (inferred input type)

The project exports a zod-derived type `CreateWindowInput` from `src/shared/schemas.ts`. A representative shape looks like:

```ts
import type { CreateWindowInput } from 'src/shared/schemas'

const payload: CreateWindowInput = {
  windowConfig: {
    title: 'Demo',
    width: 400,
    height: 300,
    frame: true,
    alwaysOnTop: false,
  },
  type: 'right-top-in',
  bound: { x: 10, y: 8, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo',
}

await window.invoke('createWindow', payload)
```

Notes:

- The `type` field supports multiple variants (see `src/shared/schemas.ts` for the full union).
- `windowConfig` is a relaxed subset of `BrowserWindow` options — `webPreferences` and some platform-specific options are managed by the helper.
- Prefer validating `params` with zod if the new window expects structured input (you can reuse schemas from `src/shared/schemas.ts`).

Full inferred TypeScript shape (for copy/paste)

```ts
// This interface mirrors the zod-inferred CreateWindowInput from src/shared/schemas.ts
export interface CreateWindowInput {
  bound?: { height?: number, width?: number, x?: number, y?: number }
  exportName?: string
  hashRoute?: string
  isFollowMove?: boolean
  params?: Record<string, any>
  type?:
    | 'left-top-in'
    | 'left-top-out'
    | 'right-top-in'
    | 'right-top-out'
    | 'left-bottom-in'
    | 'left-bottom-out'
    | 'right-bottom-in'
    | 'right-bottom-out'
    | 'center'
  windowConfig?: {
    alwaysOnTop?: boolean
    frame?: boolean
    fullscreenable?: boolean
    height?: number
    maximizable?: boolean
    minimizable?: boolean
    movable?: boolean
    resizable?: boolean
    show?: boolean
    skipTaskbar?: boolean
    title?: string
    transparent?: boolean
    width?: number
    // passthrough: additional BrowserWindow options are allowed
    [key: string]: any
  }
  // passthrough: CreateWindowInput itself is .passthrough() so extra fields are allowed
  [key: string]: any
}
```
# createWindow API

Location: `src/main/listener/createWindow.ts`

Purpose: create a new BrowserWindow (popup) with a consistent positioning strategy and optional initial params that are passed to the renderer via the URL (query/hash).

Input (WindowOptions) - summary:

- `windowConfig` (Partial<BrowserWindowConstructorOptions>): most BrowserWindow options (the helper does not override `webPreferences` by default)
- `type`: 'center' | 'left-top-in' | 'left-top-out' | 'right-top-in' | 'right-top-out' | 'left-bottom-in' | 'left-bottom-out' | 'right-bottom-in' | 'right-bottom-out' | 'center' — relative position to the parent window
- `bound`?: { x?: number, y?: number, width?: number, height?: number } — optional rectangle used for exact sizing/offset
- `params`?: Record<string, any>` — will be serialized and appended to the new window URL
- `hashRoute`?: string — optional hash route to open inside the renderer

Behavior & rules:

- If `parent` is provided (or main process supplies the current mainWindow as parent), positioning is computed relative to the parent's bounds.
- `type === 'center'` centers the new window in the parent bounds.
- Corner types compute an offset from parent's edges using `bound.x` / `bound.y` when provided.
- If `bound.width` or `bound.height` is provided, the window's bounds (size + position) are set accordingly before showing.

Example (renderer):

```ts
await window.invoke('createWindow', {
  windowConfig: { title: 'Right-top popup', parent: window },
  type: 'right-top-in',
  bound: { x: 10, y: 10, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo'
})
```

TypeScript example (inferred input type)

The project exports a zod-derived type `CreateWindowInput` from `src/shared/schemas.ts`. A representative shape looks like:

```ts
import type { CreateWindowInput } from 'src/shared/schemas'

const payload: CreateWindowInput = {
  windowConfig: {
    title: 'Demo',
    width: 400,
    height: 300,
    frame: true,
    alwaysOnTop: false,
  },
  type: 'right-top-in',
  bound: { x: 10, y: 8, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo',
}

await window.invoke('createWindow', payload)
```

Notes:

- The `type` field supports multiple variants (see `src/shared/schemas.ts` for the full union).
- `windowConfig` is a relaxed subset of `BrowserWindow` options — `webPreferences` and some platform-specific options are managed by the helper.
- Prefer validating `params` with zod if the new window expects structured input (you can reuse schemas from `src/shared/schemas.ts`).

Full inferred TypeScript shape (for copy/paste)

```ts
// This interface mirrors the zod-inferred CreateWindowInput from src/shared/schemas.ts
export interface CreateWindowInput {
  bound?: { height?: number, width?: number, x?: number, y?: number }
  exportName?: string
  hashRoute?: string
  isFollowMove?: boolean
  params?: Record<string, any>
  type?:
    | 'left-top-in'
    | 'left-top-out'
    | 'right-top-in'
    | 'right-top-out'
    | 'left-bottom-in'
    | 'left-bottom-out'
    | 'right-bottom-in'
    | 'right-bottom-out'
    | 'center'
  windowConfig?: {
    alwaysOnTop?: boolean
    frame?: boolean
    fullscreenable?: boolean
    height?: number
    maximizable?: boolean
    minimizable?: boolean
    movable?: boolean
    resizable?: boolean
    show?: boolean
    skipTaskbar?: boolean
    title?: string
    transparent?: boolean
    width?: number
    // passthrough: additional BrowserWindow options are allowed
    [key: string]: any
  }
  // passthrough: CreateWindowInput itself is .passthrough() so extra fields are allowed
  [key: string]: any
}
```
# createWindow API

Location: `src/main/listener/createWindow.ts`

Purpose: create a new BrowserWindow (popup) with a consistent positioning strategy and optional initial params that are passed to the renderer via the URL (query/hash).

Input (WindowOptions) - summary:

- `windowConfig` (Partial<BrowserWindowConstructorOptions>): most BrowserWindow options (the helper does not override `webPreferences` by default)
- `type`: 'center' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' — relative position to the parent window
- `bound`?: { x?: number, y?: number, width?: number, height?: number } — optional rectangle used for exact sizing/offset
- `params`?: Record<string, any> — will be serialized and appended to the new window URL
- `hashRoute`?: string — optional hash route to open inside the renderer

Behavior & rules:

- If `parent` is provided (or main process supplies the current mainWindow as parent), positioning is computed relative to the parent's bounds.
- `type === 'center'` centers the new window in the parent bounds.
- Corner types compute an offset from parent's edges using `bound.x` / `bound.y` when provided.
- If `bound.width` or `bound.height` is provided, the window's bounds (size + position) are set accordingly before showing.

Example (renderer):

```ts
await window.invoke('createWindow', {
  windowConfig: { title: 'Right-top popup', parent: window },
  type: 'right-top',
  bound: { x: 10, y: 10, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo'
})
```

Notes:

- Implementation details (e.g. exact offset math) live in `src/main/listener/createWindow.ts` — adjust there if you want different spacing or animations.
- Consider validating `params` shape with zod schemas (exported types in `src/shared/schemas.ts`) if renderer expects a structured payload.
