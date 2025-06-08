import { asyncComputed, useMemoize, watchArray } from '@vueuse/core'
import { computed, ref, type Ref, shallowRef } from 'vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/backend/dist/routes/forum'
import type { Topic } from '@yukkuricraft-forums-archive/backend/dist/routes/topic'
import type { Post } from '@yukkuricraft-forums-archive/backend/dist/routes/posts'
import type { User } from '@yukkuricraft-forums-archive/backend/dist/routes/user.ts'
import type { RouteLocationRaw } from 'vue-router'
import { pageCount } from '@/util/pageCount.ts'

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
  signal: AbortSignal,
  params?: Record<string, string | number | (string | number)[]>,
) {
  const urlParams = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((subvalue) => {
        urlParams.append(key, typeof subvalue === 'string' ? subvalue : subvalue.toString())
      })
    } else {
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

const forumsBySlugMemoized = useMemoize(
  async (slug: string, signal: AbortSignal) =>
    await doFetch<ForumTree[]>(`/api/forumsBySlug/${slug}`, 'forums by slug', signal),
)

export interface TopicsOrderingRequestParams {
  sortBy?: 'dateLastUpdate' | 'dateStartedPost' | 'replies' | 'title' | 'members'
  order?: 'asc' | 'desc'
}

export interface TopicsRequestParams extends TopicsOrderingRequestParams {
  page?: number
  pageSize?: number
}

const stickyTopicsMemoized = useMemoize(
  async (forumId: string, params: TopicsOrderingRequestParams, signal: AbortSignal) =>
    await doFetch<Topic[]>(`/api/forums/${forumId}/stickyTopics`, 'topics', signal, { ...params }),
)
const topicsMemoized = useMemoize(
  async (forumId: string, params: TopicsRequestParams, signal: AbortSignal) =>
    await doFetch<Topic[]>(`/api/forums/${forumId}/topics`, 'topics', signal, { ...params }),
)
const topicOrOtherIdMemoized = useMemoize(
  async (topicId: string, signal: AbortSignal): Promise<[Topic | null, RouteLocationRaw | null]> => {
    try {
      return [await doFetch<Topic>(`/api/topics/${topicId}`, 'topic', signal), null]
    } catch (error) {
      if (error instanceof NotFoundError) {
        let res
        try {
          res = await doFetch<
            | { forum: { forumSlug: string } }
            | { topic: { forumSlug: string; topicSlug: string } }
            | { post: { forumSlug: string; topicSlug: string; idx: number } }
          >(`/api/unknownObject/${topicId}`, 'unknownObject', signal)
        } catch (error2) {
          throw error
        }

        if ('forum' in res) {
          const parts = res.forum.forumSlug.split('/')
          return [
            null,
            {
              name: 'forum',
              params: { sectionSlug: parts[0], forumPath: parts.slice(1) },
            } as const satisfies RouteLocationRaw,
          ]
        } else if ('topic' in res) {
          const parts = res.topic.forumSlug.split('/')
          return [
            null,
            {
              name: 'forum',
              params: { sectionSlug: parts[0], forumPath: parts.slice(1), topicId, topic: res.topic.topicSlug },
            } as const satisfies RouteLocationRaw,
          ]
        } else {
          const parts = res.post.forumSlug.split('/')
          const pageSize = 10 // Should be the default

          const page = pageCount(res.post.idx, pageSize)

          return [
            null,
            {
              name: 'forum',
              params: {
                sectionSlug: parts[0],
                forumPath: parts.slice(1),
                topicId,
                topic: res.post.topicSlug,
                pageStr: `page${page}`,
              },
              query: { p: topicId },
              hash: `#post${topicId}`,
            } as const satisfies RouteLocationRaw,
          ]
        }
      }

      throw error
    }
  },
)
//  TODO: query params
const postsMemoized = useMemoize(
  async (topicId: string, page: number, signal: AbortSignal) =>
    await doFetch<Post[]>(`/api/topics/${topicId}/posts?page=${page}`, 'posts', signal),
)

interface MemoizedAsyncComputed<A, Error = unknown> {
  state: Ref<A>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  requestedAt: Ref<number>
}

function makeMemoizedAsyncComputed<A, Error = ResponseCodeError>(
  fn: (signal: AbortSignal) => Promise<A>,
  initialState: A,
): MemoizedAsyncComputed<A, Error> {
  const evaluating = ref(false)
  const error = ref<Error | null>(null) as Ref<Error>
  const requestedAt = ref(new Date().getTime())

  const state = asyncComputed(
    async (onCancel) => {
      const abortController = new AbortController()
      onCancel(() => abortController.abort())
      requestedAt.value = new Date().getTime()
      return await fn(abortController.signal)
    },
    initialState,
    {
      evaluating,
      onError: (e) => (error.value = e as Error),
    },
  )

  return {
    state,
    isLoading: evaluating,
    error,
    requestedAt,
  }
}

export function useRootForums(): MemoizedAsyncComputed<ForumTree[]> {
  return useForums(ref([]))
}

export function useForumForums(): MemoizedAsyncComputed<ForumTree[]> {
  const root = useRootForums()
  const forumState = computed(() => root.state.value.find((t) => t.slug === 'forum')?.subForums ?? [])

  return { ...root, state: forumState }
}

export function useForums(slug: Ref<string[]>): MemoizedAsyncComputed<ForumTree[], ResponseCodeError> {
  return makeMemoizedAsyncComputed((signal) => forumsBySlugMemoized(slug.value.join('/'), signal), [])
}

export function useStickyTopics(
  forumId: Ref<string>,
  params: Ref<TopicsOrderingRequestParams>,
): MemoizedAsyncComputed<Topic[], ResponseCodeError> {
  return makeMemoizedAsyncComputed((signal) => stickyTopicsMemoized(forumId.value, params.value, signal), [])
}

export function useTopics(
  forumId: Ref<string>,
  params: Ref<TopicsRequestParams>,
): MemoizedAsyncComputed<Topic[], ResponseCodeError> {
  return makeMemoizedAsyncComputed((signal) => topicsMemoized(forumId.value, params.value, signal), [])
}

export function useTopic(
  topicId: Ref<string>,
): MemoizedAsyncComputed<[topic: Topic | undefined | null, redirect: RouteLocationRaw | null], ResponseCodeError> {
  return makeMemoizedAsyncComputed<
    [topic: Topic | undefined | null, redirect: RouteLocationRaw | null],
    ResponseCodeError
  >((signal) => topicOrOtherIdMemoized(topicId.value, signal), [undefined, null])
}

export function usePosts(topicId: Ref<string>, page: Ref<number>): MemoizedAsyncComputed<Post[], ResponseCodeError> {
  return makeMemoizedAsyncComputed((signal) => postsMemoized(topicId.value, page.value, signal), [])
}

const userCache = shallowRef<Record<number, MemoizedAsyncComputed<User | null, ResponseCodeError>>>({})

export function useUsers(
  userIds: Ref<number[]>,
): Ref<Record<number, MemoizedAsyncComputed<User | null, ResponseCodeError>>> {
  watchArray(
    userIds,
    (v, old, added) => {
      const usersToLookup = added.filter((v) => !userCache.value[v])

      if (usersToLookup.length === 0) {
        return userCache
      }

      const evaluating = ref(false)
      const error = ref<ResponseCodeError | null>(null) as Ref<ResponseCodeError>
      const requestedAt = ref(new Date().getTime())

      const state = asyncComputed(
        async () => {
          requestedAt.value = new Date().getTime()
          const res = await doFetch<User[]>('/api/users', 'users', new AbortController().signal, {
            userId: usersToLookup,
          })
          return Object.fromEntries(res.map((u) => [u.id, u]))
        },
        {},
        {
          evaluating,
          onError: (e) => (error.value = e as ResponseCodeError),
        },
      )

      return usersToLookup.map((v) => {
        const addition: MemoizedAsyncComputed<User, ResponseCodeError> = {
          state: computed(() => state.value[v] ?? null),
          isLoading: evaluating,
          error,
          requestedAt,
        }
        userCache.value[v] = addition

        return addition
      })
    },
    { immediate: true },
  )

  return userCache
}
