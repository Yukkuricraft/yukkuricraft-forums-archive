<template>
  <h1 id="resultsTop" class="title is-1">Search result</h1>

  <template v-if="searchResults?.type === 'post'">
    <SearchPost v-for="post in searchResults.results" :key="post.id" :post="post" />
  </template>
  <template v-else>
    <SearchTopic v-for="topic in searchResults?.results" :key="topic.id" :topic="topic"></SearchTopic>
  </template>

  <AutoPagination
    :current-page="p"
    :page-count="pageCount(searchResults?.total ?? 0, 10)"
    :navigate-to-page="(v) => (p = v)"
    :shown-pages="7"
  />
</template>

<script setup lang="ts">
import type { SearchJsonObj } from '@/pages/SearchPage.vue'
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import SearchPost from '@/components/search/SearchPost.vue'
import AutoPagination from '@/components/AutoPagination.vue'
import SearchTopic from '@/components/search/SearchTopic.vue'

import { pageCount } from '@/util/pathUtils.ts'
import { type PostSearchResult, type TopicSearchResult, useApi } from '@/util/Api.ts'
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{
  searchJson: SearchJsonObj
  q: string
}>()

const p = ref(1)

const processedSearchJson = computed(() => {
  const processedSearchJson = {
    ...props.searchJson,
    date: props.searchJson.date ? { ...props.searchJson.date } : undefined,
  }
  if (processedSearchJson.date) {
    if (processedSearchJson.date.from === null) {
      delete processedSearchJson.date.from
    }
    if (processedSearchJson.date.to === null) {
      delete processedSearchJson.date.to
    }
  }
  if (processedSearchJson.author?.length === 0) {
    delete processedSearchJson.author
  }
  if (processedSearchJson.date?.from === undefined && processedSearchJson.date?.to === undefined) {
    delete processedSearchJson.date
  }
  if (processedSearchJson.channel?.length === 0) {
    delete processedSearchJson.channel
  }

  return processedSearchJson
})

const processedSearchJsonDebounced = refDebounced(processedSearchJson, 500)

const api = useApi()

const { data: searchResults } = useQuery({
  queryKey: ['api', 'search', processedSearchJsonDebounced, computed(() => props.q), p],
  queryFn: ({ signal }) =>
    api.get<PostSearchResult | TopicSearchResult>(
      '/api/search',
      {
        q: props.q,
        searchJSON: JSON.stringify(processedSearchJsonDebounced.value),
        p: p.value,
      },
      signal,
    ),
})

watch(searchResults, () => {
  if (typeof document !== 'undefined') {
    document.getElementById('resultsTop')?.scrollIntoView({ behavior: 'smooth' })
  }
})
</script>
