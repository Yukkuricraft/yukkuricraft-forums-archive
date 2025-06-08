import neostandard, { plugins } from 'neostandard'
import turboPlugin from 'eslint-plugin-turbo'
import pluginSecurity from 'eslint-plugin-security'

export default (rootDir, ts = true) => [
  ...neostandard({
    ts,
    noJsx: true,
    noStyle: true,
  }),
  pluginSecurity.configs.recommended,
  ...plugins['typescript-eslint'].configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      '@typescript-eslint/only-throw-error': 'error',
    },
  },
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    ...plugins['typescript-eslint'].configs.disableTypeChecked,
  },
  {
    ignores: ['dist', 'node_modules'],
  },
]
