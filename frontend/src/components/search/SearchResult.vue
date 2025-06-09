<template>
  <h1 class="title is-1" id="resultsTop">Search result</h1>

  <template v-if="searchResults.type === 'post'">
    <SearchPost v-for="post in searchResults.results" :post="post" :key="post.id" />
  </template>
  <template v-else>
    <SearchTopic v-for="topic in searchResults.results" :topic="topic" :key="topic.id"></SearchTopic>
  </template>

  <AutoPagination
    :current-page="p"
    :page-count="pageCount(searchResults.total, 10)"
    :navigate-to-page="(v) => (p = v)"
    :shown-pages="7"
  />
</template>

<script setup lang="ts">
import type { SearchJsonObj } from '@/pages/SearchPage.vue'
import { ref, watch } from 'vue'
import type {
  SearchPost as SearchPostType,
  SearchTopic as SearchTopicType,
} from '@yukkuricraft-forums-archive/types/search'
import { watchDebounced } from '@vueuse/core'
import SearchPost from '@/components/search/SearchPost.vue'
import AutoPagination from '@/components/AutoPagination.vue'
import { pageCount } from '@/util/pageCount.ts'
import SearchTopic from '@/components/search/SearchTopic.vue'
import { doFetch } from '@/stores/utils.ts'

const props = defineProps<{
  searchJson: SearchJsonObj
  q: string
}>()

const abort = ref(new AbortController())

type PostResult = { results: SearchPostType[]; total: number; type: 'post' }
type TopicResult = { results: SearchTopicType[]; total: number; type: 'topic' }

const searchResults = ref<PostResult | TopicResult>({ results: [], total: 0, type: 'post' })

const p = ref(1)

async function fetchResults() {
  abort.value.abort()
  abort.value = new AbortController()

  document.getElementById('resultsTop')?.scrollIntoView({ behavior: 'smooth' })

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

  searchResults.value = await doFetch<PostResult | TopicResult>('/api/search', 'search', abort.value.signal, {
    q: props.q,
    searchJSON: JSON.stringify(processedSearchJson),
    p: p.value,
  })
}

watchDebounced(props, fetchResults, { debounce: 500, immediate: true })
watch(p, fetchResults)
</script>
