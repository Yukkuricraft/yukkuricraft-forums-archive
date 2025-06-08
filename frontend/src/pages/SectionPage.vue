<template>
  <div>
    <ForumSection v-if="!isLoading && section" :forum="section" :heading-level="1" />
    <template v-else>
      <div>Waiting</div>
      <!-- TODO: Handle 404 -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed } from 'vue'

import ForumSection from '../components/ForumSection.vue'
import { makeMeta } from '../pageHelpers'
import { useForumForums, useRootForums } from '../dataComposables'

const props = defineProps<{ sectionSlug: string }>()

const { state: rootSections, isLoading } = useRootForums()
const { state: forumSections } = useForumForums()
const section = computed(() =>
  props.sectionSlug.length === 0
    ? (rootSections.value.find((s) => s.slug === 'forum') ?? null)
    : (forumSections.value.find((s) => s.slug === props.sectionSlug) ?? null),
)

useHead(
  makeMeta({
    title: 'Yukkuricraft forums archive',
    description: 'The Yukkuricraft forums archive.',
    url: computed(() => `forum/${props.sectionSlug}`),
  }),
)
</script>
