// Convenience re-exports for IPC-related types used across main, preload and renderer
// This file centralizes commonly-used types so imports are short and stable.

// Re-export lower-level shared types
export type { Api, CreateWindowOpts, HttpClient, TokenApi } from './ipc.js'
export type { SchemaInputs } from './schemas.js'
export type { CreateWindowInput, UpdateWindowBoundsInput } from './schemas.js'

// Re-export main-derived types
// Note: main-derived types (MainArg / MainReturn) should be imported directly from
// `src/main/listener` where they are implementation-derived. Re-exporting them here
// can trigger ESM resolution issues in some TS configs.

export type { WindowBlurPayload } from './schemas.js'

// Helpful default import path example usage in renderer:
// import type { MainArg } from 'src/shared/ipc-types'

export {}
