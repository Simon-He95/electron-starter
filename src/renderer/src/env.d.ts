/// <reference types="vite/client" />
// NOTE: avoid importing from ../../preload here because that would pull src/preload
// into the renderer project's type-check scope. Declare a minimal PreloadAPI used
// by the renderer instead.

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

declare global {
  interface Window {
    // Custom API exposed from preload
    electron: typeof import('@electron-toolkit/preload').electronAPI
    api: typeof import('../preload').api
    http: typeof import('../main/http').http
  }
}

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
