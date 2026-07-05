<template>
  <ForumListEntry
    v-for="forum in forums"
    :key="'forum-' + forum.title"
    :heading-level="headingLevel"
    :route-params="routeParams"
    :forum="forum"
  />
</template>

<script setup lang="ts">
import type { ForumTree } from '#shared/types/forum'
import ForumListEntry from '@/components/forum/ForumListEntry.vue'
import type { ForumRoute } from '@/util/RouteTypes.js'

defineProps<{
  forums: ForumTree[]
  routeParams: ForumRoute
  headingLevel: number
}>()
</script>
