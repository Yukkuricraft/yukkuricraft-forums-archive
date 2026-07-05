<template>
  <div>
    <h1 class="title is-size-3">Yukkuricraft</h1>

    <ForumSection
      v-for="section in forumForums"
      :key="'section-' + section.slug"
      :forum="section"
      :route-params="{ forumPath: ['forum'] }"
      :heading-level="2"
    />
  </div>
</template>

<script setup lang="ts">
import { onServerPrefetch } from 'vue'

import { useForumForums } from '@/composables/apiComposables.js'
import { useStandardHead } from '~/util/pageHelpers'

import ForumSection from '../components/forum/ForumSection.vue'

const { data: forumForums, suspense } = useForumForums()

onServerPrefetch(suspense)

useStandardHead({
  description: 'The Yukkuricraft forums archive.',
  url: '',
})

definePageMeta({ name: 'home' })
</script>
