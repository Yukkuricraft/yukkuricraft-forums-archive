import 'vite/modulepreload-polyfill'
import { createYcForumsApp } from '@/app.ts'
import { createHead } from '@unhead/vue/client'

import './fontAwesomeLibrary'
import { Api, apiKey } from '@/util/Api.ts'
import { hydrate } from '@tanstack/vue-query'
import { makeUsersLoader, userLoaderInjectKey } from '@/composables/apiComposables.ts'

const { app, router, pinia, queryClient } = createYcForumsApp()
const head = createHead()
app.use(head)
const api = new Api('/')
app.provide(apiKey, api)
app.provide(userLoaderInjectKey, makeUsersLoader(api))

if ((window as any).__PINIA_STATE__) {
  pinia.state.value = JSON.parse((window as any).__PINIA_STATE__)
}
if ((window as any).__QUERY_CLIENT_STATE__) {
  hydrate(queryClient, JSON.parse((window as any).__QUERY_CLIENT_STATE__))
}

router
  .isReady()
  .then(() => app.mount('#app'))
  .catch((e) => console.error(e))
