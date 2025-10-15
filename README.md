# electron-starter

[English README](./README.en.md) · [Docs (createWindow)](./docs/createWindow.md)

一个开箱可跑的 Electron + Vite + Vue 3 + TypeScript 模板，包含：

- 主/渲染进程的类型化 IPC 封装（preload 暴露受限 API）
- 统一的弹窗/新窗口创建与定位封装（center / 四角 / 基于 bound 的精确控制）
- 开发友好的 HMR、类型检查与测试示例

仓库目录（简要）：

- `src/main` - 主进程代码（窗口管理、IPC handlers）
- `src/preload` - preload 脚本（向 renderer 暴露受限 API）
- `src/renderer` - 前端代码（Vue + Vite）
- `src/shared` - 共享类型、zod schemas 与 IPC 类型映射
- `test` - 单元 / 行为测试示例

快速开始

```bash
pnpm install
pnpm dev    # 开发（Electron + Vite HMR）
```

常用脚本（来自 package.json）：

```bash
pnpm dev            # 开发 (electron-vite dev --watch)
pnpm dev:debug      # DEBUG=true ELECTRON_DEBUG=true pnpm dev
pnpm start          # 预览 (electron-vite preview)
pnpm build          # typecheck 后运行 electron-vite build
pnpm run build:mac  # macOS 打包
pnpm run build:win  # Windows 打包
pnpm run build:linux# Linux 打包
pnpm test           # 运行 vitest
pnpm test:watch     # 监听模式运行测试
pnpm typecheck      # 运行 node/web 的类型检查
```

IPC 与 createWindow 概要

- preload（`src/preload/index.ts`）暴露 `invoke` / `onIpc` 等安全 helper，供 renderer 调用主进程已注册的 handler。
- `createWindow`（`src/main/listener/createWindow.ts`）接受 `WindowOptions`，包括：
  - `windowConfig`：传给 BrowserWindow 的大部分配置
  - `type`：'center' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom'
  - `bound`：可选矩形（x,y,width,height）用于精确控制位置/尺寸
  - `params` / `hashRoute`：会挂载到新窗口 URL 上，供渲染器读取

示例（renderer）：

```ts
await window.invoke('createWindow', {
  windowConfig: { title: '右上角窗口', parent: window },
  type: 'right-top',
  bound: { x: 10, y: 10, width: 300, height: 200 },
  params: { foo: 'bar' },
  hashRoute: 'demo'
})
```

类型与验证

- 项目使用 zod schema（`src/shared/schemas.ts`）作为 IPC 合约的单一真相：在主进程做 runtime validation，并导出供 renderer/preload 使用的 TypeScript 类型。

调试与测试

- 启用 debug 日志：

```bash
pnpm dev:debug
```

- 运行测试：

```bash
pnpm install
pnpm test
```

建议与后续

- 在 `src/shared/ipc.ts` 中集中管理频道名与类型，减少硬编码字符串。
- 可在 `listener` 中扩展更多窗口模板（如工具窗口、托盘窗口），并在 `renderer/pages` 添加示例页面，展示如何使用 `params` / `hashRoute`。

更多说明参见：`README.en.md`（英文）和 `docs/createWindow.md`（createWindow API）。


## Project Setup

Reading params / hashRoute in renderer

When a new window is opened with `params` or `hashRoute`, the helper appends them to the URL. A simple renderer-side example to read them:

```ts
// parse query params (if params were serialized to ?params=...)
const search = new URLSearchParams(window.location.search)
const paramsJson = search.get('params')
const params = paramsJson ? JSON.parse(paramsJson) : undefined

// read hash route
const hash = window.location.hash.replace(/^#/, '')

console.log('params', params, 'hash', hash)
```


### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Examples

- [electron-vite-bytecode-example](https://github.com/alex8088/electron-vite-bytecode-example), source code protection
- [electron-vite-decorator-example](https://github.com/alex8088/electron-vite-decorator-example), typescipt decorator
- [electron-vite-worker-example](https://github.com/alex8088/electron-vite-worker-example), worker and fork
