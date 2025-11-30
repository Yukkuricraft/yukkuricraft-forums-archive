<template>
  <h2 v-if="stickyTopics?.length" class="title is-4 mt-3">Sticky topics</h2>
  <TopicSummary
    v-for="topic in stickyTopics"
    :key="'stickytopic-' + topic.title"
    :topic="topic"
    :route-params="routeParams"
  />
</template>

<script setup lang="ts">
import TopicSummary from '@/components/topic/TopicSummary.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useStickyTopics } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch } from 'vue'
import type { TopicsOrderingRequestParams } from '@/stores/topics.ts'
import type { ForumRoute } from '@/util/RouteTypes.ts'

const props = defineProps<{
  routeParams: ForumRoute
  forum: ForumTree
  sortBy: TopicsOrderingRequestParams['sortBy']
  order: TopicsOrderingRequestParams['order']
}>()

const { data: stickyTopics, suspense } = useStickyTopics(
  computed(() => props.forum.id),
  computed(() => ({ sortBy: props.sortBy, order: props.order })),
)

onServerPrefetch(suspense)

defineExpose({ stickyTopics })
</script>
