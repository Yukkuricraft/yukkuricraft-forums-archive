import type {
  SearchPost as SearchPostType,
  SearchTopic as SearchTopicType,
} from '@yukkuricraft-forums-archive/types/search'
import { inject, type InjectionKey } from 'vue'

export type PostSearchResult = { results: SearchPostType[]; total: number; type: 'post' }
export type TopicSearchResult = { results: SearchTopicType[]; total: number; type: 'topic' }

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

export class Api {
  readonly #base: string
  readonly #headers?: Record<string, string>

  constructor(base: string, headers?: Record<string, string>) {
    this.#base = base
    this.#headers = headers
  }

  async get<Type>(
    route: string,
    params?: Record<string, string | number | undefined | string[] | number[]>,
    signal?: AbortSignal,
  ): Promise<Type> {
    const urlWithParams = route + recordToQuery(params ?? {})

    let usedUrl
    if (urlWithParams.startsWith('http')) {
      usedUrl = urlWithParams
    } else if (urlWithParams.startsWith('/')) {
      usedUrl = this.#base + urlWithParams.substring(1)
    } else {
      usedUrl = this.#base + urlWithParams
    }

    const res = await fetch(usedUrl, {
      headers: this.#headers,
      signal,
    })

    if (res.status === 404) {
      throw new NotFoundError(`Did not find object at ${usedUrl}`, await res.text())
    }

    if (!res.ok) {
      throw new ResponseCodeError(`Error getting object at ${usedUrl}`, res.status, await res.text())
    }

    const ret = await res.json()
    return ret as Type
  }
}
export const apiKey = Symbol('') as InjectionKey<Api>

export function recordToQuery(params: Record<string, string | number | undefined | string[] | number[]>) {
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
  const urlParamsStr = urlParams.toString()
  return urlParamsStr.length === 0 ? '' : '?' + urlParamsStr
}

export function useApi() {
  const api = inject(apiKey)
  if (!api) {
    throw new Error('No API instance found')
  }
  return api
}
