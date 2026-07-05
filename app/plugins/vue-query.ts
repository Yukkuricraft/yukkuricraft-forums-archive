import { QueryClient, VueQueryPlugin, hydrate, dehydrate, QueryCache } from '@tanstack/vue-query'
import { FetchError } from 'ofetch'
import type { Pinia } from 'pinia'

import { useAppErrorStore } from '@/stores/appError.js'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof FetchError && error.status === 403) {
          useAppErrorStore(nuxtApp.$pinia as Pinia).setStatus(error.status)
        }
      },
    }),
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  useHydration(
    'vue-query',
    () => dehydrate(queryClient),
    (data) => hydrate(queryClient, data),
  )
})
