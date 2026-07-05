import { makeUsersLoader, userLoaderInjectKey } from '~/composables/apiComposables'

export default defineNuxtPlugin((nuxtApp) => {
  const fetch = useRequestFetch()
  nuxtApp.vueApp.provide(userLoaderInjectKey, makeUsersLoader(fetch))
})
