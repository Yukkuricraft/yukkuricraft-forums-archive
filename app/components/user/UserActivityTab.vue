<template>
  <div class="box">
    <LoadingSpinner v-if="isPending" />
    <LoadingOverlay v-else :active="isFetching">
      <template v-if="activity && activity.results.length">
        <SearchPost v-for="post in activity.results" :key="'activity-' + post.id" :post="post" />
        <AutoPagination
          :current-page="page"
          :page-count="pageCount(activity.total, 10)"
          :navigate-to-page="(p) => (page = p)"
          :shown-pages="9"
        />
      </template>
      <p v-else>No activity to show.</p>
    </LoadingOverlay>
  </div>
</template>

<script setup lang="ts">
import { onServerPrefetch, ref, toRef } from 'vue'

import AutoPagination from '@/components/AutoPagination.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SearchPost from '@/components/search/SearchPost.vue'
import { useUserActivity } from '@/composables/apiComposables.js'
import { pageCount } from '@/util/pathUtils.js'

const props = defineProps<{
  userName: string | undefined
}>()

const page = ref(1)
const { data: activity, suspense, isPending, isFetching } = useUserActivity(toRef(props, 'userName'), page)

onServerPrefetch(suspense)
</script>
