<template>
  <div>
    <ForumSection v-if="section" :forum="section" :heading-level="1" />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, onServerPrefetch } from 'vue'

import ForumSection from '../components/ForumSection.vue'
import { makeMeta } from '../util/pageHelpers.ts'
import { useForumForums, useRootForums } from '@/composables/apiComposables.ts'
const props = defineProps<{ sectionSlug: string }>()

const { data: rootForums, suspense } = useRootForums()
const { data: forumForums } = useForumForums()

onServerPrefetch(suspense)

const section = computed(() =>
  props.sectionSlug.length === 0
    ? (rootForums.value?.find((s) => s.slug === 'forum') ?? null)
    : (forumForums.value?.find((s) => s.slug === props.sectionSlug) ?? null),
)

useHead(
  makeMeta({
    title: 'Yukkuricraft forums archive',
    description: 'The Yukkuricraft forums archive.',
    url: computed(() => `forum/${props.sectionSlug}`),
  }),
)
</script>
