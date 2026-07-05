<template>
  <AdvancedSearch
    v-if="advSearch"
    :search-json="searchJson"
    :q="q"
    @update:search-json="(value) => (searchJson = value)"
  />
  <hr />
  <SearchResult :q="q" :search-json="searchJson" />
</template>

<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import { computed, type Ref } from 'vue'
import z from 'zod'

import AdvancedSearch from '@/components/search/AdvancedSearch.vue'
import SearchResult from '@/components/search/SearchResult.vue'
import { useSchemaRouteQuery } from '@/composables/routeComposables.js'

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

const zOrd = z.enum(['desc', 'asc']).optional()
const zJson = z.string().transform((s, ctx) => {
  try {
    return JSON.parse(s)
  } catch {
    ctx.addIssue({
      code: 'invalid_type',
      message: 'Not valid JSON',
      expected: 'object',
      received: 'string',
    })
    return z.NEVER
  }
})

const searchJsonObj = z.object({
  keywords: z.string().optional(),
  title_only: z.boolean().optional(),
  author: z.array(z.string()).optional(),
  starter_only: z.boolean().optional(),
  date: z
    .object({
      from: z.null().or(z.coerce.date()).optional(),
      to: z.null().or(z.coerce.date()).optional(),
    })
    .optional(),
  sort: z
    .object({
      relevance: zOrd,
      title: zOrd,
      author: zOrd,
      created: zOrd,
      lastcontent: zOrd,
      replies: zOrd,
    })
    .optional(),
  view: z.enum(['default', '', 'topic']).optional(),
  channel: z.array(z.string()).optional(),
})
export type SearchJsonObj = z.infer<typeof searchJsonObj>

const searchJson: Ref<SearchJsonObj> = useSchemaRouteQuery(
  'searchJSON',
  zJson.pipe(searchJsonObj),
  (v) => JSON.stringify(v),
  computed(() => JSON.stringify({ keywords: q.value })),
  {
    mode: 'replace',
  },
)
</script>
