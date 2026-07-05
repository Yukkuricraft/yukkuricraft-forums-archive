import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      if (savedPosition) {
        return setTimeout(() => resolve(savedPosition), 100)
      }

      if (to.hash) {
        // The target post can load asynchronously (e.g. after a ?p= page redirect),
        // so poll for the element before scrolling. Offset for the fixed navbar so
        // the linked post isn't hidden behind it.
        let attempts = 0
        const scrollToHash = () => {
          if (typeof document !== 'undefined' && document.querySelector(to.hash)) {
            resolve({ el: to.hash, top: 52, behavior: 'smooth' })
          } else if (attempts++ < 20) {
            setTimeout(scrollToHash, 100)
          } else {
            resolve({ el: to.hash, top: 52 })
          }
        }
        return scrollToHash()
      }

      setTimeout(() => resolve({ left: 0, top: 0, behavior: 'smooth' }), 100)
    })
  },
}
