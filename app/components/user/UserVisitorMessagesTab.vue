<template>
  <div class="box" style="margin-bottom: 0">
    <h2 v-if="postsCount" class="title is-4">{{ localeStore.formatNumber(postsCount.posts) }} Visitor Messages</h2>
    <LoadingSpinner v-if="isPending" />
    <LoadingOverlay v-else :active="isFetching">
      <template v-if="posts && posts.length">
        <VisitorMessage v-for="post in posts" :key="'vm-' + post.id" :post="post" />
        <AutoPagination
          v-if="postsCount && postsCount.posts > 10"
          :current-page="page"
          :page-count="Math.ceil(postsCount.posts / 10)"
          :navigate-to-page="(p) => (page = p)"
          :shown-pages="9"
        />
      </template>
      <p v-else>No visitor messages to show.</p>
    </LoadingOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch, ref } from 'vue'

import AutoPagination from '@/components/AutoPagination.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import VisitorMessage from '@/components/user/VisitorMessage.vue'
import { useVisitorMessages, useVisitorMessagesCount } from '@/composables/apiComposables.js'
import { useLocaleStore } from '@/stores/localization.js'

const props = defineProps<{
  userId: number
}>()

const localeStore = useLocaleStore()

const page = ref(1)
const {
  data: posts,
  suspense: suspensePosts,
  isPending,
  isFetching,
} = useVisitorMessages(
  computed(() => props.userId),
  computed(() => ({ page: page.value, pageSize: 10 })),
)
const { data: postsCount, suspense: suspenseCount } = useVisitorMessagesCount(computed(() => props.userId))

onServerPrefetch(() => Promise.all([suspensePosts(), suspenseCount()]))
</script>
