import { createSSRApp, type Component } from 'vue'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './scss/app.scss'

import App from './App.vue'
import { createYcForumsRouter } from './router'
import { QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { ForbiddenError } from '@/util/Api.ts'
import { useAppErrorStore } from '@/stores/appError.ts'
import { START_LOCATION } from 'vue-router'

export function createYcForumsApp() {
  const app = createSSRApp(App)
  const router = createYcForumsRouter()
  const pinia = createPinia()

  app.component('FontAwesomeIcon', FontAwesomeIcon as Component)

  // Resolve the store lazily inside the callbacks rather than up front: on the client,
  // entry-client replaces `pinia.state.value` with the dehydrated state *after* this factory
  // runs, and a setup store instantiated before that replacement gets disconnected from the
  // hydrated state (its refs would stay at their initial values). Instantiating on first use
  // (App.vue setup / an actual error) happens after hydration, so it reads the real state.
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ForbiddenError) {
          useAppErrorStore(pinia).setStatus(error.status)
        }
      },
    }),
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })

  router.afterEach((_to, from) => {
    if (from !== START_LOCATION) {
      useAppErrorStore(pinia).clear()
    }
  })

  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, { queryClient })

  return { app, router, pinia, queryClient }
}
