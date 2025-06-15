<template>
  <blockquote class="is-flex">
    <FontAwesomeIcon :icon="faQuoteLeft" size="2x" class="pr-3" />
    <div style="flex: 1">
      <template v-if="referencedUser">
        Originally posted by <strong>{{ referencedUser }}</strong>
        <!-- TODO -->
        <router-link
          v-if="referencedPost"
          class="ml-1"
          :to="{
            name: 'posts',
            params: {
              sectionSlug: 'sectionSlug',
              forumPath: 'forumPath',
              topicId: 1,
              topic: 'topic',
              pageStr: 'page1',
            },
            hash: `#post${referencedPost}`,
          }"
        >
          <FontAwesomeIcon :icon="faLink" />
        </router-link>
        <br />
      </template>
      <slot></slot>
    </div>
  </blockquote>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLink, faQuoteLeft } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  referencedUser?: string | null
  referencedPost?: string | null
}>()
</script>
