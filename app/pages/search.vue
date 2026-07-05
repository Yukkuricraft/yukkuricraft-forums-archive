<template>
  <div>
    <AdvancedSearch
      v-if="advSearch"
      :search-json="searchJson"
      :q="q"
      @update:search-json="(value) => (searchJson = value)"
    />
    <hr />
    <SearchResult :q="q" :search-json="searchJson" />
  </div>
</template>

<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import { computed, type Ref } from 'vue'
import z from 'zod'

import AdvancedSearch from '@/components/search/AdvancedSearch.vue'
import SearchResult from '@/components/search/SearchResult.vue'
import { useSchemaRouteQuery } from '@/composables/routeComposables.js'
import { searchJsonObj, type SearchJsonObj, zJson } from '@/util/searchSchema.js'
import { useStandardHead } from '~/util/pageHelpers'

const q = useSchemaRouteQuery('q', z.string(), (v) => v, '')
const advSearch = useRouteQuery<string, boolean>('AdvSearch', undefined, {
  transform: {
    get: (v) => {
      return v === '1'
    },
    set: (v) => {
      return v ? '1' : '0'
    },
  },
})

const searchJson: Ref<SearchJsonObj> = useSchemaRouteQuery(
  'searchJSON',
  zJson.pipe(searchJsonObj),
  (v) => JSON.stringify(v),
  computed(() => JSON.stringify({ keywords: q.value })),
  {
    mode: 'replace',
  },
)

useStandardHead({ title: 'Search', url: '/search', description: 'Search the Yukkuricraft forums archive.' })
</script>
