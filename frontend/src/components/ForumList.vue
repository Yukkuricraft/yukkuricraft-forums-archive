<template>
  <div v-for="forum in forums" :key="'forum-' + forum.title" class="panel-block" style="display: block">
    <ConfigurableHeading :level="headingLevel + 1" class="is-size-5">
      <router-link :to="{ name: 'forum', params: { sectionSlug, forumPath: [...forumPath, forum.slug] } }">
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
              params: { sectionSlug, forumPath: [...forumPath, forum.slug, subforum.slug] },
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
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import ConfigurableHeading from './ConfigurableHeading.vue'
import { useLocaleStore } from '@/stores/localization.ts'

const localeStore = useLocaleStore()

defineProps<{
  forums: ForumTree[]
  sectionSlug: string
  forumPath: string[]
  headingLevel: number
}>()
</script>
