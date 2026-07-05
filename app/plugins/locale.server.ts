import type { Pinia } from 'pinia'

import { useLocaleStore } from '@/stores/localization.js'

export default defineNuxtPlugin((nuxtApp) => {
  const header = useRequestHeaders(['accept-language'])['accept-language']

  useLocaleStore(nuxtApp.$pinia as Pinia).locales = header
    ? header
        .split(',')
        .map((part) => part.split(';')[0].trim())
        .filter(Boolean)
    : undefined
})
