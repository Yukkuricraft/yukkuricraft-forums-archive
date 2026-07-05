import { useRouteQuery } from '@vueuse/router'
import { type MaybeRef, type Ref, type MaybeRefOrGetter, toValue } from 'vue'
import type { useRoute, useRouter } from 'vue-router'
import type z from 'zod'

export type RawQueryValue = string | string[] | number | null | undefined

export interface ReactiveRouteOptions {
  /**
   * Mode to update the router query, ref is also acceptable
   *
   * @default 'replace'
   */
  mode?: MaybeRef<'replace' | 'push'>
  /**
   * Route instance, use `useRoute()` if not given
   */
  route?: ReturnType<typeof useRoute>
  /**
   * Router instance, use `useRouter()` if not given
   */
  router?: ReturnType<typeof useRouter>
}

export function useSchemaRouteQuery<T extends z.ZodType>(
  name: string,
  schema: T,
  stringify: (v: z.output<T>) => RawQueryValue,
  defaultValue?: MaybeRefOrGetter<RawQueryValue>,
  options?: ReactiveRouteOptions,
): Ref<z.output<T>> {
  return useRouteQuery<RawQueryValue, z.output<T>>(name, defaultValue, {
    ...options,
    transform: {
      get(v) {
        if (typeof v === 'number') {
          v = Number(v)
        }

        const res = schema.safeParse(v)
        if (res.success) {
          return res.data
        }

        if (defaultValue !== undefined) {
          const fallback = schema.safeParse(toValue(defaultValue))
          if (fallback.success) {
            return fallback.data
          }
        }

        throw res.error
      },
      set(v) {
        return stringify(v)
      },
    },
  })
}
