<template>
  <div v-if="tags.length" class="tags topic-tags">
    <span v-for="tag in tags" :key="tag.id" class="tag">{{ decodeHtmlEntities(tag.text) }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '#shared/types/topic'
import { decodeHtmlEntities } from '@/util/htmlEntities.js'

defineProps<{ tags: Topic['tags'] }>()
</script>

<style scoped>
.topic-tags {
  margin-bottom: 0;
}
</style>
