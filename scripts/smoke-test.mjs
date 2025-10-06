import { CreateWindowSchema, UpdateWindowBoundsSchema, WindowBlurSchema } from '../src/shared/schemas'

try {
  CreateWindowSchema.parse({ exportName: 'test', windowConfig: { width: 100 } })
  console.log('CreateWindowSchema: ok')
}
catch (e) {
  console.error('CreateWindowSchema: fail', e)
}

try {
  UpdateWindowBoundsSchema.parse({ id: 'abc', bounds: { width: 10 } })
  console.log('UpdateWindowBoundsSchema: ok')
}
catch (e) {
  console.error('UpdateWindowBoundsSchema: fail', e)
}

try {
  WindowBlurSchema.parse({ hashRoute: '#/home', id: 1 })
  console.log('WindowBlurSchema: ok')
}
catch (e) {
  console.error('WindowBlurSchema: fail', e)
}
