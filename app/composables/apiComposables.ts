import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import DataLoader from 'dataloader'
import type { InternalApi } from 'nitropack/types'
import { FetchError } from 'ofetch'
import { computed, inject, type InjectionKey, type MaybeRef, type Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { ForumTree } from '#shared/types/forum'
import type { Post, PostEdit } from '#shared/types/post'
import type { SearchPost, SearchTopic } from '#shared/types/search'
import type { Topic } from '#shared/types/topic'
import type { User } from '#shared/types/user'
import type { TopicsOrderingRequestParams, TopicsRequestParams } from '@/stores/topics.js'
import { pageCount } from '@/util/pathUtils.js'

export type PostSearchResult = { results: SearchPost[]; total: number; type: 'post' }
export type TopicSearchResult = { results: SearchTopic[]; total: number; type: 'topic' }

export function useRootForums() {
  const fetch = useRequestFetch()
  return useQuery<ForumTree[]>({
    queryKey: ['api', 'forumsBySlug'],
    queryFn: ({ signal }) => fetch<InternalApi['/api/forumsBySlug']['get']>('/api/forumsBySlug/', { signal }),
  })
}

export function useForumForums() {
  const fetch = useRequestFetch()
  return useQuery<ForumTree[]>({
    queryKey: ['api', 'forumsBySlug'],
    queryFn: ({ signal }) => fetch<InternalApi['/api/forumsBySlug']['get']>('/api/forumsBySlug/', { signal }),
    select: (data) => data.find((f) => f.slug === 'forum')!.subForums,
  })
}

export function useStickyTopics(forumId: Ref<number | string>, params: Ref<TopicsOrderingRequestParams>) {
  const fetch = useRequestFetch()
  return useQuery<Topic[]>({
    queryKey: ['api', 'forums', forumId, 'stickyTopics', forumId, params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/forums/:forumId/stickyTopics']['get']>(`/api/forums/${forumId.value}/stickyTopics`, {
        query: { ...params.value },
        signal,
      }),
    placeholderData: (prev, prevQuery) =>
      prevQuery && String(prevQuery.queryKey[2]) === String(forumId.value) ? prev : undefined,
  })
}

export function useTopic(topicId: Ref<number | string>, existingData?: Ref<Topic | null>) {
  const fetch = useRequestFetch()
  return useQuery<Topic>({
    queryKey: ['api', 'topics', topicId],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/topics/:topicId']['get']>(`/api/topics/${topicId.value}`, { signal }),
    initialData: () => {
      const existing = existingData?.value
      return existing && String(existing.id) === String(topicId.value) ? existing : undefined
    },
  })
}

export function useTopics(forumId: Ref<number | string | undefined>, params: Ref<TopicsRequestParams>) {
  const fetch = useRequestFetch()
  return useQuery<Topic[]>({
    queryKey: ['api', 'forums', forumId, 'topics', params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/forums/:forumId/topics']['get']>(`/api/forums/${forumId.value}/topics`, {
        query: { ...params.value },
        signal,
      }),
    enabled: () => Boolean(forumId.value),
  })
}

export function usePosts(topicId: Ref<number | string>, params: Ref<{ q?: string; pageSize: number; page: number }>) {
  const fetch = useRequestFetch()
  return useQuery<Post[]>({
    queryKey: ['api', 'topics', topicId, 'posts', params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/topics/:topicId/posts']['get']>(`/api/topics/${topicId.value}/posts`, {
        query: { ...params.value },
        signal,
      }),
    placeholderData: (prev, prevQuery) =>
      prevQuery && String(prevQuery.queryKey[2]) === String(topicId.value) ? prev : undefined,
  })
}

export function usePostsCount(topicId: Ref<number | string>, params: Ref<{ q?: string }>) {
  const fetch = useRequestFetch()
  return useQuery<{ posts: number }>({
    queryKey: ['api', 'topics', topicId, 'posts', 'count', params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/topics/:topicId/posts/count']['get']>(`/api/topics/${topicId.value}/posts/count`, {
        query: { ...params.value },
        signal,
      }),
  })
}

export function usePostPage(topicId: Ref<number | string>, postId: Ref<number | undefined>, pageSize: number) {
  const fetch = useRequestFetch()
  return useQuery<{ page: number }>({
    queryKey: ['api', 'topics', topicId, 'posts', postId, 'page', pageSize],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/topics/:topicId/posts/:postId/page']['get']>(
        `/api/topics/${topicId.value}/posts/${postId.value}/page`,
        { query: { pageSize }, signal },
      ),
    enabled: () => postId.value != null,
  })
}

export function usePostEditHistory(
  topicId: Ref<number | string>,
  postId: Ref<number | string>,
  enabled: () => boolean,
) {
  const fetch = useRequestFetch()
  return useQuery<PostEdit[]>({
    queryKey: ['api', 'topics', topicId, 'posts', postId, 'editHistory'],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/topics/:topicId/posts/:postId/editHistory']['get']>(
        `/api/topics/${topicId.value}/posts/${postId.value}/editHistory`,
        { signal },
      ),
    enabled,
  })
}

export function useVisitorMessages(userId: Ref<number | string>, params: Ref<{ pageSize: number; page: number }>) {
  const fetch = useRequestFetch()
  return useQuery<Post[]>({
    queryKey: ['api', 'user', userId, 'visitorMessages', params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/user/:userId/visitorMessages']['get']>(`/api/user/${userId.value}/visitorMessages`, {
        query: { ...params.value },
        signal,
      }),
    placeholderData: (prev, prevQuery) =>
      prevQuery && String(prevQuery.queryKey[2]) === String(userId.value) ? prev : undefined,
  })
}

export function useUserActivity(userName: Ref<string | undefined>, page: Ref<number>) {
  const fetch = useRequestFetch()
  return useQuery<PostSearchResult>({
    queryKey: ['api', 'search', 'userActivity', userName, page],
    queryFn: async ({ signal }) => {
      const res = await fetch<InternalApi['/api/search']['get']>('/api/search', {
        query: {
          q: '',
          searchJSON: JSON.stringify({ author: [userName.value], sort: { created: 'desc' } }),
          p: page.value,
        },
        signal,
      })
      if (res.type !== 'post') {
        throw new Error(`Expected post search results, got '${res.type}'`)
      }
      return res
    },
    placeholderData: keepPreviousData,
    enabled: () => Boolean(userName.value),
  })
}

export function useVisitorMessagesCount(userId: Ref<number | string>) {
  const fetch = useRequestFetch()
  return useQuery<{ posts: number }>({
    queryKey: ['api', 'user', userId, 'visitorMessages', 'count'],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/user/:userId/visitorMessages/count']['get']>(
        `/api/user/${userId.value}/visitorMessages/count`,
        { signal },
      ),
  })
}

export interface ActiveUser {
  discordName: string
  user?: User | null
  isAdmin: boolean
  isStaff: boolean
}

export function useActiveUser() {
  const fetch = useRequestFetch()
  return useQuery<ActiveUser | null>({
    queryKey: ['api', '@me'],
    queryFn: async ({ signal }) => {
      try {
        return await fetch<InternalApi['/api/@me']['get']>('/api/@me', { signal })
      } catch (e) {
        if (e instanceof FetchError && e.status === 404) {
          return null
        } else {
          throw e
        }
      }
    },
  })
}

export function usePrivateMessages(params: Ref<TopicsRequestParams>) {
  const fetch = useRequestFetch()
  return useQuery<Topic[]>({
    queryKey: ['api', '@me', 'privateMessages', params],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/@me/privateMessages']['get']>(`/api/@me/privateMessages`, {
        query: { ...params.value },
        signal,
      }),
  })
}

export function usePrivateMessagesCount() {
  const fetch = useRequestFetch()
  return useQuery<{ count: number }>({
    queryKey: ['api', '@me', 'privateMessages', 'count'],
    queryFn: async ({ signal }) => {
      return await fetch<InternalApi['/api/@me/privateMessages/count']['get']>(`/api/@me/privateMessages/count`, {
        signal,
      })
    },
  })
}

export const userLoaderInjectKey = Symbol('userLoader') as InjectionKey<DataLoader<number, User>>
export function useUsersLoader() {
  const loader = inject(userLoaderInjectKey)
  if (!loader) {
    throw new Error('No user loader found')
  }
  return loader
}

export function makeUsersLoader(fetch: ReturnType<typeof useRequestFetch>): DataLoader<number, User> {
  return new DataLoader(
    async (keys: ReadonlyArray<number>) => {
      const newUsers = await fetch<InternalApi['/api/users']['get']>('/api/users', { query: { userId: [...keys] } })
      newUsers.sort((a, b) => keys.indexOf(a.id) - keys.indexOf(b.id))
      return newUsers
    },
    {
      cache: false,
    },
  )
}

export function useUser(userId: Ref<number | null | undefined>) {
  const userLoader = useUsersLoader()
  return useQuery({
    queryKey: ['api', 'users', userId],
    queryFn: () => (userId.value ? userLoader.load(userId.value) : null),
  })
}

export function useUsers(userIds: Ref<(number | null | undefined)[]>) {
  const userLoader = useUsersLoader()
  return useQuery({
    queryKey: ['api', 'users', userIds],
    queryFn: () => userLoader.loadMany(userIds.value.flatMap((u) => (u ? [u] : []))),
  })
}

function useUnknownObject(
  id: Ref<number | string | null | undefined>,
  extraKey: MaybeRef,
  enabled: () => boolean = () => true,
) {
  const fetch = useRequestFetch()
  const {
    data: unknownObject,
    isFetched,
    suspense,
  } = useQuery({
    queryKey: ['api', 'unknownObject', id, extraKey],
    queryFn: ({ signal }) =>
      fetch<InternalApi['/api/unknownObject/:id']['get']>(`/api/unknownObject/${id.value}`, { signal }),
    enabled: () => id.value !== null && id.value !== undefined && enabled(),
  })

  const route = computed<RouteLocationRaw | null>(() => {
    const res = unknownObject.value
    if (!res) {
      return null
    }

    if ('forum' in res) {
      return {
        name: 'forum',
        params: { forumPath: res.forum.forumSlug },
      }
    }

    if ('topic' in res) {
      return {
        name: 'posts',
        params: {
          forumPath: res.topic.forumSlug,
          topic: res.topic.topicSlug,
          topicId: res.topic.topicId,
        },
      }
    }

    // else post
    const page = pageCount(res.post.postIdx, 10)
    return {
      name: 'posts',
      params: {
        forumPath: res.post.forumSlug,
        topicId: res.post.topicId,
        topic: res.post.topicSlug,
        pageStr: page === 1 ? undefined : `page${page}`,
      },
      hash: `#post${res.post.postId}`,
    }
  })

  // When `enabled()` is false there is nothing to look up, so treat that as "settled".
  const isSettled = computed(() => !enabled() || isFetched.value)

  return { route, isSettled, suspense }
}

export default useUnknownObject
