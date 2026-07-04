<template>
  <h2 class="title is-4 mt-3">Topics</h2>
  <LoadingOverlay :active="isFetching">
    <TopicSummary v-for="topic in topics" :key="'topic-' + topic.title" :route-params="routeParams" :topic="topic" />
    <p v-if="topics && topics.length === 0 && !isFetching" class="has-text-grey">No topics in this forum.</p>
  </LoadingOverlay>
</template>

<script setup lang="ts">
import TopicSummary from '@/components/topic/TopicSummary.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useTopics } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch } from 'vue'
import type { TopicsOrderingRequestParams } from '@/stores/topics.ts'
import type { ForumRoute } from '@/util/RouteTypes.ts'

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
