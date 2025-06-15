import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { Api, useApi } from '@/util/Api.ts'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { inject, type InjectionKey, type Ref } from 'vue'
import type { TopicsOrderingRequestParams, TopicsRequestParams } from '@/stores/topics.ts'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import type { Post } from '@yukkuricraft-forums-archive/types/post'
import DataLoader from 'dataloader'
import type { User } from '@yukkuricraft-forums-archive/types/user'

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

export function useTopics(forumId: Ref<number | string>, params: Ref<TopicsRequestParams>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'forums', forumId, 'topics', params],
    queryFn: ({ signal }) => api.get<Topic[]>(`/api/forums/${forumId.value}/topics`, { ...params.value }, signal),
  })
}

export function usePosts(topicId: Ref<number | string>, params: Ref<{ q?: string; pageSize: number; page: number }>) {
  const api = useApi()
  return useQuery({
    queryKey: ['api', 'topics', topicId, 'posts', params],
    queryFn: ({ signal }) => api.get<Post[]>(`/api/topics/${topicId.value}/posts`, { ...params.value }, signal),
    // placeholderData: keepPreviousData, //TODO: Only for current topic
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
