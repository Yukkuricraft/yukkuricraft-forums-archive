import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useAsyncMemoizedWatchFetch } from '@/stores/utils.ts'
import { computed } from 'vue'

export const useForumsStore = defineStore('forums', () => {
  const {
    state: rootForums,
    requestedAt,
    error,
    evaluating,
    promise
  } = useAsyncMemoizedWatchFetch<ForumTree[]>(
    computed(() => '/api/forumsBySlug/'),
    'forums',
    [],
  )

  const forumForums = computed(() => rootForums.value.find((t) => t.slug === 'forum')?.subForums ?? [])

  return { rootForums, requestedAt, error, evaluating, promise, forumForums }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useForumsStore, import.meta.hot))
}
