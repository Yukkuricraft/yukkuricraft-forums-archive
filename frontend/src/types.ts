import '@tanstack/vue-query'
import type { ResponseCodeError } from '@/util/Api.ts'

declare module '@tanstack/vue-query' {
  interface Register {
    error: ResponseCodeError
  }
}
