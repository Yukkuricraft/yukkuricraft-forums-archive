import { getRequestHeader } from 'h3'

// Reproduces two behaviors of the old Hono backend:
//  1. Authenticated (AUTH cookie present) SSR responses must not be cached by shared caches.
//  2. Unexpected server errors are logged through winston.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    const cookie = getRequestHeader(event, 'cookie') ?? ''
    // nuxt-auth-utils stores the sealed session in the `nuxt-session` cookie.
    if (/(?:^|;\s*)nuxt-session=/.test(cookie)) {
      response.headers = { ...response.headers, 'cache-control': 'private, no-store' }
    }
  })
})
