import baseConfig from '@yukkuricraft-forums-archive/eslint-config/base'
import globals from 'globals'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

export default [
  ...defineConfigWithVueTs(
    ...baseConfig(import.meta.dirname, false),
    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    {
      languageOptions: {
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          extraFileExtensions: ['.vue'],
        },
      },
      rules: {
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
  ),
  {
    ignores: ['./distserver'],
  },
]
