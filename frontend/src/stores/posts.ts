import { defineStore } from 'pinia'
import { useTopicsStore } from '@/stores/topics.ts'
import { useAsyncMemoizedWatchFetch } from '@/stores/utils.ts'
import type { Post } from '@yukkuricraft-forums-archive/types/post'
import { computed, ref } from 'vue'

export const usePostsStore = defineStore('posts', () => {
  const topicStore = useTopicsStore()
  const q = ref<string | undefined>()
  const pageSize = ref(10)
  const pageRef = ref(1)

  const {
    state: posts,
    requestedAt,
    error,
    evaluating,
    promise
  } = useAsyncMemoizedWatchFetch<Post[]>(
    computed(() =>
      topicStore.selectedTopic?.id === undefined ? undefined : `/api/topics/${topicStore.selectedTopic.id}/posts`,
    ),
    'posts',
    [],
    computed(() => ({ q: q.value, pageSize: pageSize.value, page: pageRef.value })),
  )

  return { posts, requestedAt, error, evaluating, promise, q, pageSize, page: pageRef }
})
