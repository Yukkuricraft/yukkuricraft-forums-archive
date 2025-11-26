<template>
  <h2 class="title is-4 mt-3">Topics</h2>
  <TopicSummary
    v-for="topic in topics"
    :key="'topic-' + topic.title"
    :section-slug="sectionSlug"
    :forum-path="forumPath"
    :topic="topic"
  />
</template>

<script setup lang="ts">
import TopicSummary from '@/components/TopicSummary.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useTopics } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch } from 'vue'
import type { TopicsOrderingRequestParams } from '@/stores/topics.ts'

const props = defineProps<{
  sectionSlug: string
  forumPath: string[]
  forum: ForumTree
  page: number
  sortBy: TopicsOrderingRequestParams['sortBy']
  order: TopicsOrderingRequestParams['order']
}>()

const { data: topics, suspense } = useTopics(
  computed(() => props.forum.id),
  computed(() => ({ page: props.page, sortBy: props.sortBy, order: props.order })),
)

onServerPrefetch(suspense)
</script>
