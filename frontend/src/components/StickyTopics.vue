<template>
  <h2 v-if="stickyTopics?.length" class="title is-4 mt-3">Sticky topics</h2>
  <Topic
    v-for="topic in stickyTopics"
    :key="'stickytopic-' + topic.title"
    :topic="topic"
    :section-slug="sectionSlug"
    :forum-path="forumPath"
  />
</template>

<script setup lang="ts">
import Topic from '@/components/TopicSummary.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useStickyTopics } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch } from 'vue'

const props = defineProps<{ sectionSlug: string; forumPath: string[]; forum: ForumTree }>()

const { data: stickyTopics, suspense } = useStickyTopics(
  computed(() => props.forum.id),
  computed(() => ({})),
)

onServerPrefetch(suspense)

defineExpose({ stickyTopics })
</script>
