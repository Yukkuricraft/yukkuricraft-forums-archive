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
import { computed, onServerPrefetch, ref, watch } from 'vue'
import { pageCount, pageFromPath } from '@/util/pathUtils.ts'
import { useRouter } from 'vue-router'
import Pagination from '@/components/AutoPagination.vue'
import TopicSummary from '@/components/topic/TopicSummary.vue'
import { useActiveUser, usePrivateMessages, usePrivateMessagesCount } from '@/composables/apiComposables.ts'
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

const router = useRouter()
const { data: activeUser, suspense: activeUserSuspense } = useActiveUser()

function redirectIfNotAllowed() {
  if (activeUser.value !== undefined && !activeUser.value?.user) {
    return router.push('/')
  }
}

watch(activeUser, redirectIfNotAllowed, { immediate: true })

const { data: topics, suspense: privateMessagesSuspense } = usePrivateMessages(
  computed(() => ({ page: page.value, sortBy: sortBy.value, order: order.value })),
)

const { data: privateMessagesCount, suspense: privateMessagesCountSuspense } = usePrivateMessagesCount()

onServerPrefetch(async () => {
  await activeUserSuspense()
  await redirectIfNotAllowed()
  await Promise.all([privateMessagesSuspense(), privateMessagesCountSuspense()])
})
</script>
