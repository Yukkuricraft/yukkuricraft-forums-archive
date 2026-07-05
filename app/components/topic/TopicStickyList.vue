<template>
  <template v-if="stickyTopics?.length">
    <h2 class="title is-4 mt-3">Sticky topics</h2>
    <LoadingOverlay :active="isFetching">
      <TopicSummary
        v-for="topic in stickyTopics"
        :key="'stickytopic-' + topic.title"
        :topic="topic"
        :route-params="routeParams"
      />
    </LoadingOverlay>
  </template>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue'

import type { ForumTree } from '#shared/types/forum'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import TopicSummary from '@/components/topic/TopicSummary.vue'
import { useStickyTopics } from '@/composables/apiComposables.js'
import type { TopicsOrderingRequestParams } from '@/stores/topics.js'
import type { ForumRoute } from '@/util/RouteTypes.js'

const props = defineProps<{
  routeParams: ForumRoute
  forum: ForumTree
  sortBy: TopicsOrderingRequestParams['sortBy']
  order: TopicsOrderingRequestParams['order']
}>()

const {
  data: stickyTopics,
  suspense,
  isFetching,
} = useStickyTopics(
  computed(() => props.forum.id),
  computed(() => ({ sortBy: props.sortBy, order: props.order })),
)

onServerPrefetch(suspense)

defineExpose({ stickyTopics })
</script>
