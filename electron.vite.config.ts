import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from 'electron-vite'
import tailwind from 'tailwindcss'
import Pages from 'vite-plugin-pages'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
    build: {
      minify: false,
      rollupOptions: {
        output: {
          format: 'cjs',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    build: {
      assetsDir: 'assets',
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@stores': resolve('src/renderer/src/stores'),
      },
    },
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    plugins: [vue(), Pages(), vueDevTools()],
  },
})
