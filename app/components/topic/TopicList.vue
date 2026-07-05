<template>
  <h2 class="title is-4 mt-3">Topics</h2>
  <LoadingOverlay :active="isFetching">
    <TopicSummary v-for="topic in topics" :key="'topic-' + topic.title" :route-params="routeParams" :topic="topic" />
    <p v-if="topics && topics.length === 0 && !isFetching" class="has-text-grey">No topics in this forum.</p>
  </LoadingOverlay>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue'

import type { ForumTree } from '#shared/types/forum'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import TopicSummary from '@/components/topic/TopicSummary.vue'
import { useTopics } from '@/composables/apiComposables.js'
import type { TopicsOrderingRequestParams } from '@/stores/topics.js'
import type { ForumRoute } from '@/util/RouteTypes.js'

const props = defineProps<{
  routeParams: ForumRoute
  forum: ForumTree
  page: number
  sortBy: TopicsOrderingRequestParams['sortBy']
  order: TopicsOrderingRequestParams['order']
}>()

const {
  data: topics,
  suspense,
  isFetching,
} = useTopics(
  computed(() => props.forum.id),
  computed(() => ({ page: props.page, sortBy: props.sortBy, order: props.order })),
)

onServerPrefetch(suspense)
</script>
