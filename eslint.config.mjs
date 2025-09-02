import simon from '@antfu/eslint-config'

export default simon(
  {
    ignores: [
      'fixtures',
      '_fixtures',
      '**/constants-generated.ts',
      'out',
      'dist',
      'node_modules',
      './tailwind.config.ts',
      './src/renderer/src/env.d.ts'
    ]
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'error'
    }
  }
)
