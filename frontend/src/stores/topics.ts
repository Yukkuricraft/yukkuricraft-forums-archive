import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, type Ref, ref, watch } from 'vue'
import { doFetch, NotFoundError, useAsyncMemoizedWatchFetch } from '@/stores/utils.ts'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import { type RouteLocationRaw, useRouter } from 'vue-router'
import { pageCount } from '@/util/pageCount.ts'

export interface TopicsOrderingRequestParams {
  sortBy?: 'dateLastUpdate' | 'dateStartedPost' | 'replies' | 'title' | 'members'
  order?: 'asc' | 'desc'
}

export interface TopicsRequestParams extends TopicsOrderingRequestParams {
  page?: number
  pageSize?: number
}

export const useTopicsStore = defineStore('topics', () => {
  const forumIdRef = ref(0)
  const paramsRef = ref<TopicsRequestParams>({})
  const selectedTopic = ref<Topic | null>(null)

  const {
    state: topics,
    requestedAt: topicsRequestedAt,
    error: topicsError,
    evaluating: topicsEvaluating,
    promise: topicsPromise,
  } = useAsyncMemoizedWatchFetch<Topic[]>(
    computed(() => (forumIdRef.value !== 0 ? `/api/forums/${forumIdRef.value}/topics` : undefined)),
    'topics',
    [],
    computed(() => ({ ...paramsRef.value })),
  )

  const {
    state: stickyTopics,
    requestedAt: stickyTopicsRequestedAt,
    error: stickyTopicsError,
    evaluating: stickyTopicsEvaluating,
    promise: stickyTopicsPromise,
  } = useAsyncMemoizedWatchFetch<Topic[]>(
    computed(() => (forumIdRef.value !== 0 ? `/api/forums/${forumIdRef.value}/stickyTopics` : undefined)),
    'stickyTopics',
    [],
    computed(() => ({ ...paramsRef.value })),
  )

  function select(topic: Topic) {
    selectedTopic.value = topic
  }

  async function selectFromId(topicId: string): Promise<void | RouteLocationRaw> {
    if (selectedTopic.value?.id.toString() === topicId) {
      return
    }

    try {
      selectedTopic.value = await doFetch<Topic>(`/api/topics/${topicId}`, 'topic')
    } catch (error) {
      selectedTopic.value = null

      if (error instanceof NotFoundError) {
        let res
        try {
          res = await doFetch<
            | { forum: { forumSlug: string } }
            | { topic: { forumSlug: string; topicSlug: string } }
            | { post: { forumSlug: string; topicSlug: string; idx: number } }
          >(`/api/unknownObject/${topicId}`, 'unknownObject')
        } catch (error2) {
          throw error
        }

        if ('forum' in res) {
          const parts = res.forum.forumSlug.split('/')
          return {
            name: 'forum',
            params: { sectionSlug: parts[0], forumPath: parts.slice(1) },
          }
        } else if ('topic' in res) {
          const parts = res.topic.forumSlug.split('/')
          return {
            name: 'topic',
            params: {
              sectionSlug: parts[0],
              forumPath: parts.slice(1),
              topic: res.topic.topicSlug,
              topicId,
            },
          }
        } else {
          const parts = res.post.forumSlug.split('/')
          const pageSize = 10 // Should be the default

          const page = pageCount(res.post.idx, pageSize)

          return {
            name: 'topic',
            params: {
              sectionSlug: parts[0],
              forumPath: parts.slice(1),
              topicId,
              topic: res.post.topicSlug,
              pageStr: `page${page}`,
            },
            query: { p: topicId },
            hash: `#post${topicId}`,
          }
        }
      }

      throw error
    }
  }

  return {
    topics,
    topicsRequestedAt,
    topicsError,
    topicsEvaluating,
    topicsPromise,
    stickyTopics,
    stickyTopicsRequestedAt,
    stickyTopicsError,
    stickyTopicsEvaluating,
    stickyTopicsPromise,
    forumId: forumIdRef,
    params: paramsRef,
    selectedTopic,
    select,
    selectFromId,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTopicsStore, import.meta.hot))
}
