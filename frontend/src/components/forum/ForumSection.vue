<template>
  <div class="panel is-primary">
    <ConfigurableHeading :level="headingLevel" class="panel-heading">
      <router-link class="has-text-white is-underlined" :to="{ name: 'forum', params: { forumPath: newForumPath } }">
        {{ forum.title }}
      </router-link>
    </ConfigurableHeading>

    <ForumList
      :forums="forum.subForums"
      :route-params="{ forumPath: newForumPath }"
      :heading-level="headingLevel"
    ></ForumList>
  </div>
</template>

<script setup lang="ts">
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import ConfigurableHeading from '../ConfigurableHeading.vue'
import ForumList from './ForumList.vue'
import { computed } from 'vue'
import type { ForumRoute } from '@/util/RouteTypes.ts'

const props = defineProps<{
  forum: ForumTree
  headingLevel: number
  routeParams: ForumRoute
}>()

const newForumPath = computed(() =>
  props.forum.slug === props.routeParams.forumPath?.at(-1)
    ? props.routeParams.forumPath
    : [...props.routeParams.forumPath ?? [], props.forum.slug],
)
</script>
