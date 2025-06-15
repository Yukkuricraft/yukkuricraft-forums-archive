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
  {
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
  ...(ts ? plugins['typescript-eslint'].configs.recommendedTypeChecked : []),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        projectService: ts,
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
  ts
    ? {
        files: ['**/*.js'],
        ...plugins['typescript-eslint'].configs.disableTypeChecked,
      }
    : {},
  {
    ignores: ['dist', 'node_modules'],
  },
]
