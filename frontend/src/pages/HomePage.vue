<template>
  <h1 class="title is-size-3">Yukkuricraft</h1>

  <ForumSection v-for="section in forumStore.forumForums" :key="'section-' + section.slug" :forum="section" :heading-level="2" />
  <template v-if="forumStore.evaluating">
    <div>Waiting</div>
    <!-- TODO: Handle 5xx errors -->
  </template>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'

import { makeMeta } from '../pageHelpers'
import ForumSection from '../components/ForumSection.vue'
import { useForumsStore } from '@/stores/forums.ts'

const forumStore = useForumsStore()

useHead(
  makeMeta({
    title: 'Yukkuricraft forums archive',
    description: 'The Yukkuricraft forums archive.',
    url: '',
  }),
)
</script>
