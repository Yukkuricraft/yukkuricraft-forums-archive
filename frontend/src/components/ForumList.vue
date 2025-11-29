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
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import ForumListEntry from '@/components/ForumListEntry.vue'
import type { ForumRoute } from '@/util/RouteTypes.ts'

defineProps<{
  forums: ForumTree[]
  routeParams: ForumRoute
  headingLevel: number
}>()
</script>
