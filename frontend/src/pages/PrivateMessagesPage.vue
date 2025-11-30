<template>
  <h1>Private Messages</h1>

  <TopicSummary v-for="topic in topics" :key="'topic-' + topic.title" :route-params="routeParams" :topic="topic" />

  <Pagination
    v-if="privateMessagesCount"
    :current-page="page"
    :page-count="pageCount(privateMessagesCount.count, 10)"
    :link-gen="pageLinkGen"
    :shown-pages="9"
  />
</template>

<script setup lang="ts">
import { computed, onServerPrefetch, ref } from 'vue'
import { pageCount, pageFromPath } from '@/util/pathUtils.ts'
import { NotFoundError, useApi } from '@/util/Api.ts'
import { useQuery } from '@tanstack/vue-query'
import type { User } from '@yukkuricraft-forums-archive/types/user'
import { useRouter } from 'vue-router'
import Pagination from '@/components/AutoPagination.vue'
import TopicSummary from '@/components/topic/TopicSummary.vue'
import { usePrivateMessages, usePrivateMessagesCount } from '@/composables/apiComposables.ts'
import type { TopicsOrderingRequestParams } from '@/stores/topics.ts'

const props = defineProps<{
  pageStr?: string
}>()
const page = computed(() => pageFromPath(props.pageStr))
const pageLinkGen = computed(() => (newPage: number) => ({
  name: 'private-messages',
  params: {
    pageStr: newPage === 1 ? undefined : `page${newPage}`,
  },
}))
const routeParams = { forumPath: ['special', 'private-messages'] }

const sortBy = ref<TopicsOrderingRequestParams['sortBy']>('dateLastUpdate')
const order = ref<TopicsOrderingRequestParams['order']>('desc')

const api = useApi()
const router = useRouter()
const { suspense: activeUserSuspense } = useQuery({
  queryKey: ['api', '@me'],
  queryFn: async ({ signal }) => {
    try {
      const user = await api.get<{ discordName: string; user: User | undefined; isAdmin: boolean; isStaff: boolean }>(
        '/api/@me',
        undefined,
        signal,
      )
      if (!user.user) {
        await router.push('/')
        return null
      }
    } catch (e) {
      if (e instanceof NotFoundError) {
        await router.push('/')
        return null
      } else {
        throw e
      }
    }
  },
})

const { data: topics, suspense: privateMessagesSuspense } = usePrivateMessages(
  computed(() => ({ page: page.value, sortBy: sortBy.value, order: order.value })),
)

const { data: privateMessagesCount, suspense: privateMessagesCountSuspense } = usePrivateMessagesCount()

onServerPrefetch(() => Promise.all([activeUserSuspense(), privateMessagesSuspense(), privateMessagesCountSuspense()]))
</script>
