export type { Api, ArgsFor, CreateWindowOpts, HttpClient, InvokeArgs, IPCInvokeMap, TokenApi } from './ipc.js'
// Barrel file: re-export commonly used types from schemas and ipc
// Use type-only exports so this file has no runtime cost.
export type { CreateWindowInput, SchemaInputs, UpdateWindowBoundsInput, WindowBlurPayload } from './schemas.js'

export {}
