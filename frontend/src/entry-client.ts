import 'vite/modulepreload-polyfill'
import { createYcForumsApp } from '@/app.ts'
import { createHead } from '@unhead/vue/client'

import './fontAwesomeLibrary'
import { Api, apiKey } from '@/util/Api.ts'
import { hydrate } from '@tanstack/vue-query'
import { makeUsersLoader, userLoaderInjectKey } from '@/composables/apiComposables.ts'

declare global {
  interface Window {
    __PINIA_STATE__?: string
    __QUERY_CLIENT_STATE__?: string
  }
}

const api = new Api('/')
const { app, router, pinia, queryClient } = createYcForumsApp()
const head = createHead()
app.use(head)
app.provide(apiKey, api)
app.provide(userLoaderInjectKey, makeUsersLoader(api))

if (window.__PINIA_STATE__) {
  pinia.state.value = JSON.parse(window.__PINIA_STATE__)
}
if (window.__QUERY_CLIENT_STATE__) {
  hydrate(queryClient, JSON.parse(window.__QUERY_CLIENT_STATE__))
}

router
  .isReady()
  .then(() => app.mount('#app'))
  .catch((e) => console.error(e))
