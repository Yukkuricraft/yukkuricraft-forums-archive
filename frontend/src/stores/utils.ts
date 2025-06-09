import { type Ref, ref, watchEffect } from 'vue'
import { skipHydrate } from 'pinia'

export class ResponseCodeError extends Error {
  status: number
  body: string
  constructor(message: string, status: number, body: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

export class NotFoundError extends ResponseCodeError {
  constructor(message: string, body: string) {
    super(message, 404, body)
  }
}

export async function doFetch<Response>(
  url: string,
  errorMessageObj: string,
  signal?: AbortSignal,
  params?: Record<string, string | number | (string | number)[] | undefined>,
) {
  const urlParams = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((subvalue) => {
        urlParams.append(key, typeof subvalue === 'string' ? subvalue : subvalue.toString())
      })
    } else if (value !== undefined) {
      urlParams.append(key, typeof value === 'string' ? value : value.toString())
    }
  })
  const urlWithParams = urlParams.toString() === '' ? url : `${url}?${urlParams.toString()}`

  const res = await fetch(urlWithParams, {
    signal,
  })

  if (res.status === 404) {
    throw new NotFoundError(`Did not find ${errorMessageObj} at ${urlWithParams}`, await res.text())
  }

  if (!res.ok) {
    throw new ResponseCodeError(`Error getting ${errorMessageObj} at ${urlWithParams}`, res.status, await res.text())
  }

  const ret = await res.json()
  return ret as Response
}

export function useAsyncWatch<A, Err = Error>(fn: (signal: AbortSignal) => Promise<A>, initialState: A) {
  const evaluating = ref(false)
  const error = ref<Error | null>(null) as Ref<Error>
  const requestedAt = ref(new Date().getTime())
  const abortController = ref<AbortController | null>(null)
  const state = ref(initialState)
  const promise = ref<Promise<A> | null>(null)

  watchEffect(async () => {
    abortController.value?.abort()
    abortController.value = new AbortController()
    evaluating.value = true
    requestedAt.value = new Date().getTime()
    try {
      promise.value = fn(abortController.value.signal)
      state.value = await promise.value
    } catch (e) {
      console.error(e)
      error.value = e as Error
    }
    evaluating.value = false
  })

  return { state, error: skipHydrate(error), evaluating, requestedAt, promise: skipHydrate(promise) }
}

export function useAsyncMemoizedWatchFetch<A, Err = ResponseCodeError>(
  url: Ref<string | undefined>,
  errorMessageObj: string,
  initialState: A,
  params?: Ref<Record<string, string | number | (string | number)[] | undefined>>,
) {
  // TODO: Memoize

  return useAsyncWatch(async (signal) => {
    const to = url.value
    if (to === undefined) {
      return initialState
    }

    return await doFetch<A>(to, errorMessageObj, signal, params?.value)
  }, initialState)
}
