import type { Pinia } from 'pinia'
import { START_LOCATION } from 'vue-router'

import { useAppErrorStore } from '@/stores/appError.js'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  router.afterEach((_to, from) => {
    if (from !== START_LOCATION) {
      useAppErrorStore(nuxtApp.$pinia as Pinia).clear()
    }
  })
})
