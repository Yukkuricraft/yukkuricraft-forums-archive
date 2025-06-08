<template>
  <AdvancedSearch
    v-if="advSearch"
    :searchJson="searchJson"
    @update:searchJson="(value) => (searchJson = value)"
    :q="q"
  />
  <hr />
  <SearchResult :q="q" :searchJson="searchJson" />
</template>

<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import z from 'zod'
import { useSchemaRouteQuery } from '@/routeComposables.ts'
import { computed, type Ref } from 'vue'
import AdvancedSearch from '@/components/search/AdvancedSearch.vue'
import SearchResult from '@/components/search/SearchResult.vue'

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
  } catch (e) {
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
  date: z.object({ from: z.date().or(z.null()).optional(), to: z.date().or(z.null()).optional() }).optional(),
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
  computed(() => `{"keywords": "${q.value}"}`),
  {
    mode: 'replace',
  },
)
</script>
