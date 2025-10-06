// Type-only re-exports for main-derived IPC types.
// This is a declaration file so it won't emit runtime imports and avoids ESM extension issues.

import type { ImplArg, MainArg, MainArgs, MainReturn } from '../main/listener'

export type { ImplArg, MainArg, MainArgs, MainReturn }

// Usage in renderer:
// import type { MainArg } from 'src/shared/ipc-types'

export {}
