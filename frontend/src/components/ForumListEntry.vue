<template>
  <div class="panel-block" style="display: block">
    <ConfigurableHeading :level="headingLevel + 1" class="is-size-5">
      <router-link :to="{ name: 'forum', params: baseRouteParams }">
        {{ forum.title }}
      </router-link>
    </ConfigurableHeading>

    <div v-if="forum.description" class="block">
      <p>{{ forum.description }}</p>
    </div>

    <div v-if="forum.subForums && forum.subForums.length" class="block">
      <strong>Subforums:</strong>
      <div>
        <span v-for="subforum in forum.subForums" :key="'forum-' + forum.title + '-' + subforum.title">
          <router-link
            :to="{
              name: 'forum',
              params: { forumPath: [...baseRouteParams.forumPath, subforum.slug] },
            }"
          >
            {{ subforum.title }}
          </router-link>
          ({{ localeStore.formatNumber(subforum.topicsCount) }}/{{ localeStore.formatNumber(subforum.postsCount) }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ConfigurableHeading from '@/components/ConfigurableHeading.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { useLocaleStore } from '@/stores/localization.ts'
import type { ForumRoute } from '@/util/RouteTypes.ts'
import { computed } from 'vue'

const props = defineProps<{
  headingLevel: number
  routeParams: ForumRoute
  forum: ForumTree
}>()

const localeStore = useLocaleStore()

const baseRouteParams = computed(() => ({ forumPath: [...props.routeParams.forumPath, props.forum.slug] }))
</script>
