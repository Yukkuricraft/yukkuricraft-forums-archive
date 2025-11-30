<template>
  <h1 class="title is-size-3">Yukkuricraft</h1>

  <ForumSection
    v-for="section in forumForums"
    :key="'section-' + section.slug"
    :forum="section"
    :route-params="{ forumPath: ['forum'] }"
    :heading-level="2"
  />
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'

import { makeMeta } from '../util/pageHelpers.ts'
import ForumSection from '../components/forum/ForumSection.vue'
import { onServerPrefetch } from 'vue'
import { useForumForums } from '@/composables/apiComposables.ts'

const { data: forumForums, suspense } = useForumForums()

onServerPrefetch(suspense)

useHead(
  makeMeta({
    title: 'Yukkuricraft forums archive',
    description: 'The Yukkuricraft forums archive.',
    url: '',
  }),
)
</script>
