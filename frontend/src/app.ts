import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './scss/app.scss'

import App from './App.vue'
import { createYcForumsRouter } from './router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Api } from '@/util/Api.ts'

export function createYcForumsApp(api: Api) {
  const app = createSSRApp(App)
  const router = createYcForumsRouter(api)
  const pinia = createPinia()

  app.component('FontAwesomeIcon', FontAwesomeIcon)

  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })

  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, { queryClient })

  return { app, router, pinia, queryClient }
}
