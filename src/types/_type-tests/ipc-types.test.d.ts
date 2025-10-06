// Declaration-only compile-time tests for IPC types.
// This file is included by both node and web tsconfigs and will be type-checked.

import type { CreateWindowInput, UpdateWindowBoundsInput } from '../../shared/schemas'
import type { MainArg } from '../ipc-types'

// Type aliases used only for compile-time checks
type TestCreateWindow = MainArg<'createWindow'>
type TestUpdateBounds = MainArg<'updateWindowBounds'>

type SchemaCW = CreateWindowInput
type SchemaUB = UpdateWindowBoundsInput

// simple compatibility checks
type _assert1 = TestCreateWindow extends SchemaCW ? true : false
type _assert2 = TestUpdateBounds extends SchemaUB ? true : false

export {}
