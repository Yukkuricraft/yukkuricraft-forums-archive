import pluginSecurity from 'eslint-plugin-security'
import neostandard from 'neostandard'
import tseslint from 'typescript-eslint'

import withNuxt from './.nuxt/eslint.config.mjs'

// Rules from typescript-eslint's type-checked preset, without its parser
// override — Nuxt/neostandard already own the parser, and clobbering it breaks
// Vue template parsing.
const typeCheckedRules = Object.assign(
  {},
  ...tseslint.configs.recommendedTypeChecked.map((c) => c.rules).filter(Boolean),
)

export default withNuxt(
  ...neostandard({
    ts: true,
    noJsx: true,
    noStyle: true,
  }),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['prisma.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      ...typeCheckedRules,
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
    },
  },
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./.nuxt/tsconfig.server.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // Server handlers pass Zod's `schema.parse` as a callback to h3 validators.
    // `parse` doesn't use `this`, so unbound-method only produces false positives here.
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  pluginSecurity.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 5,
          multiline: 1,
        },
      ],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/require-default-prop': 'off',
    },
  },
)
