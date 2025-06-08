import baseConfig from '@yukkuricraft-forums-archive/eslint-config/base'
import globals from 'globals'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default [
  ...defineConfigWithVueTs(...baseConfig(import.meta.dirname, false), vueTsConfigs.recommended, {
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
    },
  })
]
