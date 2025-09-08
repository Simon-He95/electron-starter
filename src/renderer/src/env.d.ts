/// <reference types="vite/client" />
export * from '../../shared'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

type RouteRecordRaw = import('vue-router').RouteRecordRaw

declare module 'virtual:generated-pages' {
  const routes: RouteRecordRaw[]
  export default routes
}
