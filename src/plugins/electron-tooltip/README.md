# Electron Tooltip（独立 BrowserWindow）

这个包实现了一个“脱离主窗口 DOM”的 tooltip / popconfirm：内容渲染在独立的 `BrowserWindow` 中，主进程负责定位、边界翻转、跨屏重算；渲染进程负责 UI 渲染与尺寸上报。

**能力**
- 跟随 parent window：move / resize / 全屏切换时保持位置一致
- 智能翻转：优先 `top/bottom/left/right`，超出 workArea 会自动切换并 clamp
- 多窗口安全：用 `id` 防止 A 的 leave 误关 B 的 tooltip
- macOS 全屏降级：全屏时使用 renderer 内的 inline tooltip，避免 Space 切换
- 交互模式：`behavior: 'manual'` 支持 popconfirm（不会因 blur/hover 离开自动关闭）

---

## 安装

包名以你最终发布为准（本仓库内部示例位于 `src/plugins/electron-tooltip`）：

```bash
pnpm add electron-tooltip
```

---

## 你需要提供什么（集成清单）

这个包是“协议 + 能力”，UI 由你控制。集成需要 3 部分：

1) **主进程**
   - 创建 `ElectronTooltipManager`
   - 注册 IPC handlers（`ipcMain.handle(...)`）
   - 实现 `loadTooltipWindow(win)`（加载你的 tooltip 窗口页，比如 `#tooltip` 路由）
2) **渲染进程（主窗口）**
   - 注册 `v-electron-tooltip` 指令
3) **渲染进程（tooltip 窗口页）**
   - 你自己实现 `tooltip.vue`
   - 用 `createElectronTooltipWindowClient()` 接收 payload、上报 size、控制关闭/固定

此外需要 preload 提供桥接：
- `window.invoke(channel, payload?)`（ipcRenderer.invoke）
- `window.onIpc(channel, listener)`（ipcRenderer.on，监听 `tooltip-set`）

本仓库已在 `src/preload/index.ts` 暴露这些全局。

---

## 快速接入（electron-vite + Vue）

下面以本仓库为例（可直接照抄）：

### 1) 主进程：创建 tooltip manager

参考：`src/main/tooltip/TooltipManager.ts`

你要提供两件事：
- `preloadPath`：你的 preload bundle 路径
- `loadTooltipWindow(win)`：加载 tooltip 窗口页（通常是 `#tooltip` 路由）

### 2) 主进程：注册 IPC handlers

参考：`src/main/listener/index.ts`

把：
- `createElectronTooltipIpcHandlers(tooltipManager)`

merge 进你的 handler map（或逐个 `ipcMain.handle` 注册）。

### 3) 渲染进程（主窗口）：注册 directive

参考：`src/renderer/src/main.ts`、`src/renderer/src/utils/electronTooltip.ts`

最简单：

```ts
import { vElectronTooltip } from 'electron-tooltip'
app.directive('electron-tooltip', vElectronTooltip)
```

如果你要用 `content.component`（Vue 组件渲染），并且希望 **macOS 全屏降级（inline tooltip）** 的内容也一致，需要给 directive 提供组件解析器：

```ts
import { createElectronTooltipDirective } from 'electron-tooltip'
import MyTooltipCard from './MyTooltipCard.vue'

app.directive(
  'electron-tooltip',
  createElectronTooltipDirective(undefined, {
    resolveInlineComponent: (name) => {
      if (name === 'MyTooltipCard') return MyTooltipCard
      return null
    },
  }),
)
```

### 4) 渲染进程（tooltip 窗口页）：实现你自己的 UI

参考：`src/renderer/src/pages/tooltip.vue`

核心点只有三个：
- `client.start()`：先注册 `tooltip-set` 监听，再发送 `tooltipRendererReady` 握手（避免首帧丢消息）
- `client.reportSize({ width, height })`：每次内容变化后上报，用于主进程定位/避免闪烁
- hover 进入/离开 tooltip 自身时调用 `client.setTooltipHovered(true/false)`：让鼠标移到 tooltip 上时不消失

---

## 主窗口使用方式

### 文本 tooltip

```vue
<div v-electron-tooltip="'hello'">hover</div>
```

### 指定方向/宽度

```vue
<div v-electron-tooltip="{ text: 'hi', placement: 'right', maxWidth: 320, offset: 10 }">hover</div>
```

### Vue 组件渲染（推荐）

> tooltip 在另一个 BrowserWindow/renderer 里，不能直接传组件对象；用 `name + props` 协议。

```vue
<div
  v-electron-tooltip="{
    component: { name: 'MyTooltipCard', props: { title: 'Hi' } },
    placement: 'bottom'
  }"
>
  hover
</div>
```

在你的 `tooltip.vue` 中按 `payload.content.component.name` 做映射并渲染（本仓库 demo：`DemoTooltipCard`）。

---

## Popconfirm / 手动关闭（解决二次弹窗失焦误关）

交互式内容（按钮/输入框/二次弹窗）用 `behavior: 'manual'`：

```vue
<div
  v-electron-tooltip="{
    component: { name: 'MyPopConfirm', props: { ... } },
    behavior: 'manual',
  }"
>
  click
</div>
```

`behavior: 'manual'` 的语义：
- 不会因 anchor leave 自动关闭
- 不会因 parent window blur 自动关闭（打开二次弹窗时不会误关）
- tooltip window 会启用可交互（允许点击）
- 必须在 tooltip UI 内显式 `client.close()` 关闭

本仓库 demo：
- 触发：`src/renderer/src/pages/_demo.vue`
- UI：`src/renderer/src/components/DemoPopConfirm.vue`

---

## 约定：如何从自定义组件里关闭 tooltip

推荐在 `tooltip.vue` 渲染组件时注入两个 props（本仓库已这么做）：
- `__closeTooltip: () => void` → 调用 `client.close()`
- `__setPinned: (pinned: boolean) => void` → 调用 `client.setPinned(pinned)`

这样你的 `MyPopConfirm` 组件内部可以直接 `props.__closeTooltip()`。

---

## 安全注意事项

- `content.html` 会以 `innerHTML` 渲染；如果内容来源不可信，请在应用侧 sanitize。

---

## 卸载

1) 移除主进程 tooltip manager 与 IPC handlers（参考 `src/main/tooltip/TooltipManager.ts`、`src/main/listener/index.ts`）
2) 移除 tooltip 窗口页（例如 `tooltip.vue`）以及你在 `loadTooltipWindow()` 里的路由/加载逻辑
3) 移除 directive 注册（`app.directive('electron-tooltip', ...)`）
4) `pnpm remove electron-tooltip`

---

## 发布 / 构建（本仓库）

本仓库内置 package 位于 `src/plugins/electron-tooltip`：

```bash
pnpm -C src/plugins/electron-tooltip build
```

发布前建议：
- 修改 `src/plugins/electron-tooltip/package.json` 的 `name`（建议带 scope）
- 移除 `"private": true`
- 在该目录执行 `npm publish`

---

## 常见问题（Troubleshooting）

### 1) 首次 hover 不显示 / 需要第二次才显示

一般是 tooltip window 页面没有先注册 `tooltip-set` 监听就发了 handshake。确保：
- tooltip 页面 `onMounted` 里 `client.start()`（start 内部会先 `onIpc('tooltip-set')` 再 invoke ready）

### 2) 首次 hover 闪烁

本方案依赖 size-handshake：主进程会等待 tooltip 页面 `reportSize()` 后再 show。
如果你替换了 UI，确保 payload ready 后会触发一次 `reportSize()`。

### 3) macOS 全屏下组件渲染不一致

macOS 全屏会降级到 inline tooltip，要让 inline 内容一致：
- 用 `createElectronTooltipDirective(..., { resolveInlineComponent })` 提供组件解析器
