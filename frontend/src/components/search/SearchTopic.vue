<template>
  <TopicSummary v-if="(topic.forum.slug ?? [])[0] === 'forum'" :topic="convertedTopic" :section-slug="sectionSlug" :forum-path="forumPath" />
  <div v-else>
    <!-- TODO -->
    TODO
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '@yukkuricraft-forums-archive/backend/dist/routes/topic.ts'
import type { SearchTopic as SearchTopicType } from '@yukkuricraft-forums-archive/backend/dist/routes/search.ts'
import TopicSummary from '@/components/TopicSummary.vue'
import { computed } from 'vue'

const props = defineProps<{ topic: SearchTopicType }>()

const sectionSlug = computed(() => {
  const slug = props.topic.forum.slug ?? []
  if (slug.length < 2) return ''
  return slug[1]
})

const forumPath = computed(() => {
  const slug = props.topic.forum.slug ?? []
  return slug.slice(2)
})

const convertedTopic = computed<Topic>(() => {
  const t = props.topic
  return {
    id: t.id,
    forumId: t.forum.id ?? 1,
    creatorId: t.creatorId,
    createdAt: t.createdAt,
    slug: t.slug,
    title: t.title,
    sticky: false,
    deletedAt: null,
    hidden: false,
    postCount: t.postCount,
    redirectTo: undefined,
    lastPostSummary: {
      postId: t.lastPost.id ?? undefined,
      at: t.lastPost.createdAt ?? undefined,
      userId: t.lastPost.creatorId,
    },
  } satisfies Topic
})
</script>
