import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { Api, useApi } from '@/util/Api.ts'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { computed, inject, type InjectionKey, type MaybeRef, type Ref } from 'vue'
import type { TopicsOrderingRequestParams, TopicsRequestParams } from '@/stores/topics.ts'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import type { Post } from '@yukkuricraft-forums-archive/types/post'
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
    initialData: () => existingData?.value ?? undefined,
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
  const { data: unknownObject } = useQuery({
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

  return computed<RouteLocationRaw | null>(() => {
    const res = unknownObject.value
    if (res) {
      if ('forum' in res) {
        const parts = [...res.forum.forumSlug]
        if (parts[0] === 'forum') {
          parts.shift()
        } else {
          // TODO
        }

        return {
          name: 'forum',
          params: { sectionSlug: parts[0], forumPath: parts.slice(1) },
        }
      } else if ('topic' in res) {
        const parts = [...res.topic.forumSlug]
        if (parts[0] === 'forum') {
          parts.shift()
        } else {
          // TODO
        }

        return {
          name: 'topic',
          params: {
            sectionSlug: parts[0],
            forumPath: parts.slice(1),
            topic: res.topic.topicSlug,
            topicId: res.topic.topicId,
          },
        }
      } else {
        // else post
        const parts = [...res.post.forumSlug]
        if (parts[0] === 'forum') {
          parts.shift()
        } else {
          // TODO
        }
        const pageSize = 10 // Should be the default

        const page = pageCount(res.post.postIdx, pageSize)

        return {
          name: 'topic',
          params: {
            sectionSlug: parts[0],
            forumPath: parts.slice(1),
            topicId: res.post.topicId,
            topic: res.post.topicSlug,
            pageStr: `page${page}`,
          },
          hash: `#post${res.post.postId}`,
        }
      }
    }

    return null
  })
}

export default useUnknownObject
