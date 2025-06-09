import 'vite/modulepreload-polyfill'
import { createYcForumsApp } from '@/app.ts'
import { createHead } from '@unhead/vue/client'

import './fontAwesomeLibrary'

const { app, router, pinia } = createYcForumsApp()
const head = createHead()
app.use(head)

if ((window as any).__PINIA_STATE__) {
  pinia.state.value = JSON.parse((window as any).__PINIA_STATE__)
}

router.isReady().then(() => app.mount('#app')).catch((e) => console.error(e))