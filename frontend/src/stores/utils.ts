import { ref } from 'vue'
import { skipHydrate } from 'pinia'
import { recordToQuery, ResponseCodeError, useApi } from '@/util/Api.ts'

export function useMemoizedFetcher<Type>(initialState: Type) {
  const api = useApi()
  const currentValue = ref<Type>(initialState)
  const currentRoute = ref<string | null>(null)

  const isLoading = ref(false)
  const error = ref<ResponseCodeError | null>(null)
  const requestedAt = ref(new Date().getTime())
  const abortController = ref<AbortController | null>(null)
  const promise = ref<Promise<Type> | null>(null)

  const previousValues = new Map<string, { requestedAt: number; value: Type }>()

  async function fetcher(
    url: string | undefined,
    params?: Record<string, string | number | undefined | string[] | number[]>,
  ): Promise<Type> {
    if (!url) {
      return currentValue.value
    }

    const paramsStr = recordToQuery(params ?? {})

    const to = url + paramsStr
    if (currentRoute.value === to) {
      return (await promise.value) ?? currentValue.value
    }

    currentRoute.value = to

    const prev = previousValues.get(to)
    if (prev) {
      currentValue.value = prev.value
      isLoading.value = false
      requestedAt.value = prev.requestedAt
      promise.value = Promise.resolve(prev.value)
      return prev.value
    }

    abortController.value?.abort()
    abortController.value = new AbortController()
    isLoading.value = true
    requestedAt.value = new Date().getTime()

    const p = api.get<Type>(url, params, abortController.value.signal)
    promise.value = p

    try {
      const res = await p
      isLoading.value = false
      return res
    } catch (e) {
      if (e instanceof ResponseCodeError) {
        error.value = e
        isLoading.value = false
      }
      throw e
    }
  }

  return {
    currentValue,
    currentRoute,
    isLoading,
    error: skipHydrate(error),
    requestedAt,
    promise: skipHydrate(promise),
    fetcher,
  }
}
