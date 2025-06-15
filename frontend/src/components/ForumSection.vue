<template>
  <div class="panel is-primary">
    <ConfigurableHeading :level="headingLevel" class="panel-heading">
      <router-link class="has-text-white is-underlined" :to="{ name: 'section', params: { sectionSlug: forum.slug } }">
        {{ forum.title }}
      </router-link>
    </ConfigurableHeading>

    <ForumList
      :forums="forum.subForums"
      :section-slug="forum.slug"
      :forum-path="[]"
      :heading-level="headingLevel"
    ></ForumList>
  </div>
</template>

<script setup lang="ts">
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import ConfigurableHeading from './ConfigurableHeading.vue'
import ForumList from './ForumList.vue'

defineProps<{
  forum: ForumTree
  headingLevel: number
}>()
</script>
