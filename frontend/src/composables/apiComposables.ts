import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { Api, NotFoundError, useApi, type PostSearchResult } from '@/util/Api.ts'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { computed, inject, type InjectionKey, type MaybeRef, type Ref } from 'vue'
import type { TopicsOrderingRequestParams, TopicsRequestParams } from '@/stores/topics.ts'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import type { Post, PostEdit } from '@yukkuricraft-forums-archive/types/post'
import DataLoader from 'dataloader'
import type { User } from '@yukkuricraft-forums-archive/types/user'
import type { RouteLocationRaw } from 'vue-router'
import { pageCount } from '@/util/pathUtils.ts'

export function useRootForums() {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'forumsBySlug'],
    queryFn: ({ signal }) => api.get<ForumTree[]>('/api/forumsBySlug/', undefined, signal),
  })
}

export function useForumForums() {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'forumsBySlug'],
    queryFn: ({ signal }) => api.get<ForumTree[]>('/api/forumsBySlug/', undefined, signal),
    select: (data) => data.find((f) => f.slug === 'forum')!.subForums,
  })
}

export function useStickyTopics(forumId: Ref<number | string>, params: Ref<TopicsOrderingRequestParams>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'forums', forumId, 'stickyTopics', forumId, params],
    queryFn: ({ signal }) => api.get<Topic[]>(`/api/forums/${forumId.value}/stickyTopics`, { ...params.value }, signal),
    placeholderData: keepPreviousData, //TODO: Only for current forum
  })
}

export function useTopic(topicId: Ref<number | string>, existingData?: Ref<Topic | null>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId],
    queryFn: ({ signal }) => api.get<Topic>(`/api/topics/${topicId.value}`, undefined, signal),
    initialData: () => {
      const existing = existingData?.value
      return existing && String(existing.id) === String(topicId.value) ? existing : undefined
    },
  })
}

export function useTopics(forumId: Ref<number | string | undefined>, params: Ref<TopicsRequestParams>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'forums', forumId, 'topics', params],
    queryFn: ({ signal }) => api.get<Topic[]>(`/api/forums/${forumId.value}/topics`, { ...params.value }, signal),
    enabled: () => Boolean(forumId.value),
  })
}

export function usePosts(topicId: Ref<number | string>, params: Ref<{ q?: string; pageSize: number; page: number }>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId, 'posts', params],
    queryFn: ({ signal }) => api.get<Post[]>(`/api/topics/${topicId.value}/posts`, { ...params.value }, signal),
    placeholderData: keepPreviousData, //TODO: Only for current topic
  })
}

export function usePostsCount(topicId: Ref<number | string>, params: Ref<{ q?: string }>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId, 'posts', 'count', params],
    queryFn: ({ signal }) =>
      api.get<{ posts: number }>(`/api/topics/${topicId.value}/posts/count`, { ...params.value }, signal),
  })
}

export function usePostPage(topicId: Ref<number | string>, postId: Ref<number | undefined>, pageSize: number) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId, 'posts', postId, 'page', pageSize],
    queryFn: ({ signal }) =>
      api.get<{ page: number }>(`/api/topics/${topicId.value}/posts/${postId.value}/page`, { pageSize }, signal),
    enabled: () => postId.value != null,
  })
}

export function usePostEditHistory(
  topicId: Ref<number | string>,
  postId: Ref<number | string>,
  enabled: () => boolean,
) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId, 'posts', postId, 'editHistory'],
    queryFn: ({ signal }) =>
      api.get<PostEdit[]>(`/api/topics/${topicId.value}/posts/${postId.value}/editHistory`, undefined, signal),
    enabled,
  })
}

export function useVisitorMessages(userId: Ref<number | string>, params: Ref<{ pageSize: number; page: number }>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'user', userId, 'visitorMessages', params],
    queryFn: ({ signal }) => api.get<Post[]>(`/api/user/${userId.value}/visitorMessages`, { ...params.value }, signal),
    placeholderData: keepPreviousData, //TODO: Only for current user
  })
}

export function useUserActivity(userName: Ref<string | undefined>, page: Ref<number>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'search', 'userActivity', userName, page],
    queryFn: ({ signal }) =>
      api.get<PostSearchResult>(
        '/api/search',
        {
          q: '',
          searchJSON: JSON.stringify({ author: [userName.value], sort: { created: 'desc' } }),
          p: page.value,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
    enabled: () => Boolean(userName.value),
  })
}

export function useVisitorMessagesCount(userId: Ref<number | string>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'user', userId, 'visitorMessages', 'count'],
    queryFn: ({ signal }) => api.get<{ posts: number }>(`/api/user/${userId.value}/visitorMessages/count`, {}, signal),
  })
}

export interface ActiveUser {
  discordName: string
  user: User | undefined
  isAdmin: boolean
  isStaff: boolean
}

export function useActiveUser() {
  const api = useApi()
  return useQuery({
    queryKey: ['api', '@me'],
    queryFn: async ({ signal }) => {
      try {
        return await api.get<ActiveUser>('/api/@me', undefined, signal)
      } catch (e) {
        if (e instanceof NotFoundError) {
          return null
        } else {
          throw e
        }
      }
    },
  })
}

export function usePrivateMessages(params: Ref<TopicsRequestParams>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', '@me', 'privateMessages', params],
    queryFn: ({ signal }) => api.get<Topic[]>(`/api/@me/privateMessages`, { ...params.value }, signal),
  })
}

export function usePrivateMessagesCount() {
  const api = useApi()
  return useQuery({
    queryKey: ['api', '@me', 'privateMessages', 'count'],
    queryFn: async ({ signal }) => {
      return await api.get<{ count: number }>(`/api/@me/privateMessages/count`, undefined, signal)
    },
  })
}

export const userLoaderInjectKey = Symbol('userLoader') as InjectionKey<DataLoader<number, User>>
export function useUsersLoader() {
  const loader = inject(userLoaderInjectKey)
  if (!loader) {
    throw new Error('No API instance found')
  }
  return loader
}

export function makeUsersLoader(api: Api): DataLoader<number, User> {
  return new DataLoader(
    async (keys: ReadonlyArray<number>) => {
      const newUsers = await api.get<User[]>('/api/users', {
        userId: [...keys],
      })
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
  const api = useApi()
  const {
    data: unknownObject,
    isFetched,
    suspense,
  } = useQuery({
    queryKey: ['api', 'unknownObject', id, extraKey],
    queryFn: ({ signal }) => {
      return api.get<
        | { forum: { forumSlug: string[] } }
        | { topic: { forumSlug: string[]; topicSlug: string; topicId: number } }
        | { post: { forumSlug: string[]; topicSlug: string; topicId: number; postIdx: number; postId: number } }
      >(`/api/unknownObject/${id.value}`, undefined, signal)
    },
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
