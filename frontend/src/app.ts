import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './scss/app.scss'

import './fontAwesomeLibrary'

import App from './App.vue'
import { createYcForumsRouter } from './router'

export function createYcForumsApp() {
  const app = createApp(App)
  const router = createYcForumsRouter()
  const head = createHead()

  app.component('FontAwesomeIcon', FontAwesomeIcon)

  app.use(createPinia())
  app.use(router)
  app.use(head)

   
  return { app, router, head }
}

const { app, router } = createYcForumsApp()

router.isReady().then(() => app.mount('#app')).catch((e) => console.error(e))
