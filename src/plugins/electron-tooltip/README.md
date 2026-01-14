# Electron Tooltip (detached window)

This module implements a tooltip that is rendered in a dedicated `BrowserWindow` (detached from the main window DOM), with:

- Follow parent window move/resize/fullscreen
- Edge flipping (top/bottom/left/right) + clamping to workArea
- Multi-window safety via per-tooltip `id`
- macOS fullscreen fallback to inline (in-renderer) tooltip to avoid Space switching
- Hovering the tooltip itself keeps it visible

## Install

`pnpm add @simon_he/electron-tooltip` (or `npm i`, `yarn add`)

## Integrate (electron-vite + Vue)

### 1) Main process

Create a `ElectronTooltipManager` and add the IPC handlers:

- Example reference in this repo: `src/main/tooltip/TooltipManager.ts`
- IPC registration reference in this repo: `src/main/listener/index.ts`

You must provide:

- `preloadPath` (your preload bundle path)
- `loadTooltipWindow(win)` (how to load a renderer route/page that renders the tooltip UI)

### 2) Renderer: directive

Register the Vue directive:

- Example reference in this repo: `src/renderer/src/main.ts` (registers `v-electron-tooltip`)

If you use `content.component` and you want macOS fullscreen fallback (inline tooltip) to render the same component,
create the directive with a resolver:

```ts
import { createElectronTooltipDirective } from '@simon_he/electron-tooltip'
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

### 3) Renderer: tooltip window page (your UI)

This package is headless for the tooltip window UI: you provide the renderer page and render whatever you want.

Use `createElectronTooltipWindowClient()` to receive tooltip payloads and report size/hover state back to main:

- Client: `createElectronTooltipWindowClient()` from this package
- Example page (app-owned UI) in this repo: `src/renderer/src/pages/tooltip.vue`

### 4) Preload bridge

The renderer expects two globals:

- `window.invoke(channel, payload?)` → IPC invoke
- `window.onIpc(channel, listener)` → IPC on

This repo already exposes those in `src/preload/index.ts`.

## Using it

In Vue templates:

- `v-electron-tooltip="'hello'"` (text)
- `v-electron-tooltip="{ text, placement: 'right', maxWidth: 320, offset: 10 }"`
- Vue component rendering (in the tooltip window): `v-electron-tooltip="{ component: { name: 'MyTooltipCard', props: { title: 'Hi' } } }"`
  - `name` is resolved by your tooltip window page (it must import/register that component).

## Popconfirm / manual close

For interactive content (buttons, inputs) use `behavior: 'manual'`:

- It will not auto-close on anchor leave
- It will not auto-close on parent window blur (so opening a secondary dialog won't dismiss it)
- You must close it explicitly from your tooltip window UI

In your tooltip window page, you can call:

- `client.close()` to close the current tooltip
- `client.setPinned(true/false)` if you want to pin/unpin dynamically

## Example: custom component tooltip

**1) In your tooltip window page**, resolve `payload.content.component.name` to a local Vue component and render it:

- Reference implementation: `src/renderer/src/pages/tooltip.vue`
- Example component in this repo: `src/renderer/src/components/DemoTooltipCard.vue`

**2) In your main window**, pass `component: { name, props }`:

- Reference usage: `src/renderer/src/pages/_demo.vue`

## Uninstall

- Remove the main-process IPC handlers and tooltip manager setup.
- Remove the tooltip window route/page you added (e.g. `tooltip.vue`) and the window loader (`loadTooltipWindow`).
- Remove the renderer directive registration (`app.directive('electron-tooltip', ...)`).
- Remove the dependency: `pnpm remove @simon_he/electron-tooltip`

## Publish as npm package

This repo keeps the package in `src/plugins/electron-tooltip`.

- Build: `pnpm -C src/plugins/electron-tooltip build`
- Publish: remove `"private": true` in `src/plugins/electron-tooltip/package.json` and run `npm publish` from that folder
