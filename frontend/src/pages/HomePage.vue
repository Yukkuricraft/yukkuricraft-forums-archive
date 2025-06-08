<template>
  <h1 class="title is-size-3">Yukkuricraft</h1>

  <ForumSection v-for="section in sections" :key="'section-' + section.slug" :forum="section" :heading-level="2" />
  <template v-if="isLoading">
    <div>Waiting</div>
    <!-- TODO: Handle 5xx errors -->
  </template>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'

import { makeMeta } from '../pageHelpers'
import ForumSection from '../components/ForumSection.vue'
import { useForumForums } from '../dataComposables'

useHead(
  makeMeta({
    title: 'Yukkuricraft forums archive',
    description: 'The Yukkuricraft forums archive.',
    url: '',
  }),
)

const { state: sections, isLoading } = useForumForums()
</script>
