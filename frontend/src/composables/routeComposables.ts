import { useRouteQuery } from '@vueuse/router'
import { type MaybeRef, type Ref, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import z from 'zod'

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

        return schema.parse(v)
      },
      set(v) {
        return stringify(v)
      },
    },
  })
}
