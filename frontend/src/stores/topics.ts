import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import { ref } from 'vue'

export interface TopicsOrderingRequestParams {
  sortBy?: 'dateLastUpdate' | 'dateStartedPost' | 'replies' | 'title' | 'members'
  order?: 'asc' | 'desc'
}

export interface TopicsRequestParams extends TopicsOrderingRequestParams {
  page?: number
  pageSize?: number
}

export const useTopicsStore = defineStore('topics', () => {
  const currentTopic = ref<Topic | null>(null)

  function selectTopic(topic: Topic) {
    currentTopic.value = topic
  }

  return {
    currentTopic,
    selectTopic,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTopicsStore, import.meta.hot))
}
