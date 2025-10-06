import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only look for tests in our test/ folder to avoid running tests
    // shipped inside node_modules by dependency packages.
    include: ['test/**/*.spec.{js,ts,mjs,mts,jsx,tsx}', 'test/**/*.test.{js,ts,mjs,mts,jsx,tsx}'],
    // Still explicitly exclude declaration-only folders and node_modules
    exclude: ['node_modules', '**/src/types/**', '**/*.d.ts'],
  },
})
