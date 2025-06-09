import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './scss/app.scss'

import App from './App.vue'
import { createYcForumsRouter } from './router'

export function createYcForumsApp() {
  const app = createSSRApp(App)
  const router = createYcForumsRouter()
  const pinia = createPinia()

  app.component('FontAwesomeIcon', FontAwesomeIcon)

  app.use(pinia)
  app.use(router)

  return { app, router, pinia }
}
