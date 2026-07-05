import { library, config } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle, faLink, faQuoteLeft, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { Component } from 'vue'

config.autoAddCss = false
library.add(faLink, faQuoteLeft, faSpinner, faTimesCircle, faTimes)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon as Component)
})
