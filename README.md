# Electron Starter 模板

这是一个轻量的 Electron 起手模板，使用 Vite + Vue + TypeScript，并且对主/渲染进程通信与新开窗口的位置进行了简易封装，方便快速上手桌面应用开发。

## 核心目标

- 提供一个可运行的起手模板，开箱可开发、打包（electron-builder）。
- 对 IPC（主进程 <-> 渲染进程）做类型友好且简单的封装，使用 `preload` 暴露简洁 API。
- 对创建新窗口（弹窗）的定位与尺寸做统一封装，支持中心、四角和基于边界的定位。

## 目录与关键文件

- `src/main` - 主进程代码
  - `index.ts` - 主进程启动与 IPC handler 注册入口
  - `listener/createWindow.ts` - 新窗口创建与定位逻辑（包含各种定位类型与 bound 尺寸控制）
  - `listener/index.ts` - 定义主进程的 IPC handlers（如 `createWindow`、`ping`）
- `src/preload/index.ts` - preload 脚本，向渲染进程安全暴露 `api.send(channel, ...args)` 用法
- `src/shared/types.ts` - 项目内使用的类型定义（如 `WindowOptions`、`IPCInvokeMap`）

> 注意：`src/shared/ipc.ts` 在模板中当前为空，你可以在此扩展项目内共享的 IPC 常量或辅助函数。

## 技术栈

- Electron
- Vite (v7)
- Vue 3 + TypeScript
- pnpm
- Tailwind CSS
- pinia
- electron-vite（开发/构建工具链）
- electron-builder（打包）

版本与依赖请参见 `package.json`。模板已兼顾常见现代前端体验（HMR、类型检查、格式化与 ESLint）。

## 快速开始

在 macOS / Linux / Windows 的终端运行：

```bash
pnpm install
pnpm dev    # 开发（Electron + Vite HMR）
```

打包/发布：

```bash
pnpm build         # 编译并通过 electron-vite 打包
pnpm run build:mac # macOS 打包（更多 target 可见 package.json scripts）
```

也可用 `pnpm start` 启动预览（基于 electron-vite 的 preview）。

## IPC（通信）说明

预加载脚本 `src/preload/index.ts` 暴露了一个轻量的 `api.send` 方法用于调用主进程的 `ipcMain.handle` 注册的 handler：

- 调用方式（渲染进程）：

```ts
// renderer 里直接使用全局 window.api（或在类型已声明时使用 window.api.send）
await window.api.send('ping')
// 或创建窗口
await window.api.send('createWindow', {
  windowConfig: {
    title: '新窗口',
    width: 500,
    height: 400
  },
  type: 'right-top',
  bound: { x: 10, y: 10, width: 500, height: 400 },
  params: { foo: 'bar' },
  hashRoute: 'demo'
})
```

实现细节：

- 主进程里 `src/main/listener/index.ts` 将 `ipcListener` 中的每个函数注册为 `ipcMain.handle(key, handler)`。
- handler 的签名在实现中省略了 `IpcMainInvokeEvent`，便于直接在渲染/预加载中调用。

## createWindow（弹窗定位）说明

`createWindow` 位于 `src/main/listener/createWindow.ts`，主要特点：

- 接受 `WindowOptions`，包括：
  - `windowConfig`: 传给 `BrowserWindow` 的大部分配置（不包含 webPreferences 的覆盖）
  - `type`: 支持 `'center' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom'`，用于相对于父窗口的定位
  - `bound`: 可选的矩形（x, y, width, height）用于精确控制位置/尺寸
  - `params` / `hashRoute`: 会拼到渲染器的 URL 上，便于在新窗口中读取初始参数

- 定位规则简述：
  - 若提供 `parent` 会基于 parent 的 bounds 进行定位
  - `type === 'center'` 默认使窗口出现在父窗口中央
  - 四角定位会根据 `bound.x` / `bound.y` 偏移计算目标坐标
  - 如果提供 `bound.width` / `bound.height`，会先设置窗口 bounds（尺寸与位置）

示例：从渲染进程请求在父窗口右上角打开一个 300x200 的窗口

```ts
await window.api.send('createWindow', {
  windowConfig: { title: '右上角窗口', parent: window },
  type: 'right-top',
  bound: { x: 10, y: 10, width: 300, height: 200 }
})
```

（`parent` 通常由主进程在调用处注入：模板里的 `ipcListener.createWindow` 会把 `context.mainWindow` 作为 parent）

## 类型支持

- `src/shared/types.ts` 中定义了 `IPCInvokeMap` 与 `WindowOptions`，配合 TypeScript 能在编译期获得良好提示。
- `src/preload/index.ts` 导出了 `PreloadAPI` 类型：可在 renderer 端声明全局类型以获得自动完成。

示例类型声明（可加入 renderer 的 `env.d.ts`）：

```ts
declare global {
  interface Window {
    api: import('../preload').PreloadAPI
  }
}
```

## 常见问题与排查

- 如果窗口没有正确定位：请确认父窗口存在且 `parent.getBounds()` 返回正确值；可在主进程里打印 bounds 做调试。
- 若 preload 的 API 在渲染进程不可用：检查 `webPreferences.preload` 路径以及 `contextIsolation` 设置。

## 下一步建议

- 在 `src/shared/ipc.ts` 中集中管理频道常量与类型，以避免字符串硬编码。
- 可在 `listener` 里扩展更多便捷的窗口模板（如托盘窗口、工具窗口等）。
- 添加示例页面（renderer/pages）展示如何通过 `params` / `hashRoute` 共享数据。

---

Requirements coverage

- 写一个中文 README 描述本仓库用途、通信与弹窗封装位置和用法： Done
- 列出使用到的现代技术栈（vite7、pnpm、tailwindcss 等）： Done
- 提供运行/打包脚本示例（基于 package.json）： Done

如果你希望我把 README 的某一部分改为英文，或加入截图和更详细的 API 文档，我可以继续完善。

<h1 align="center">electron-app</h1>

<p align="center">An Electron application with Vue3 and TypeScript</p>

<p align="center">
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/electron" alt="electron-version">
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/electron-vite" alt="electron-vite-version" />
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/electron-builder" alt="electron-builder-version" />
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/vite" alt="vite-version" />
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/vue" alt="vue-version" />
<img src="https://img.shields.io/github/package-json/dependency-version/alex8088/electron-vite-boilerplate/dev/typescript" alt="typescript-version" />
</p>

<p align='center'>
<img src='./build/electron-vite-vue-ts.png'/>
</p>

## Features

- 💡 Optimize asset handling
- 🚀 Fast HMR for renderer processes
- 🔥 Hot reloading for main process and preload scripts
- 🔌 Easy to debug
- 🔒 Compile to v8 bytecode to protect source code

## Getting Started

Read [documentation](https://electron-vite.org/) for more details.

- [Configuring](https://electron-vite.org/config/)
- [Development](https://electron-vite.org/guide/dev.html)
- [Asset Handling](https://electron-vite.org/guide/assets.html)
- [HMR](https://electron-vite.org/guide/hmr.html) & [Hot Reloading](https://electron-vite.org/guide/hot-reloading.html)
- [Debugging](https://electron-vite.org/guide/debugging.html)
- [Source code protection](https://electron-vite.org/guide/source-code-protection.html)
- [Distribution](https://electron-vite.org/guide/distribution.html)
- [Troubleshooting](https://electron-vite.org/guide/troubleshooting.html)

You can also use the [create-electron](https://github.com/alex8088/quick-start/tree/master/packages/create-electron) tool to scaffold your project for other frameworks (e.g. `React`, `Svelte` or `Solid`).

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## Project Setup

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
