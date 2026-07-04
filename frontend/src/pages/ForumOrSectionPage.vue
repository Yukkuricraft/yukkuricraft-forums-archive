<template>
  <ForumSection v-if="topics?.length === 0 && forum" :route-params="routeParams" :forum="forum" :heading-level="1" />
  <ForumPage v-else-if="forum" :route-params="routeParams" :page="page" :forum="forum" />
</template>

<script setup lang="ts">
import type { ForumRoute } from '@/util/RouteTypes.ts'
import { useRootForums, useTopics } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch, watchEffect } from 'vue'
import { pageFromPath } from '@/util/pathUtils.ts'
import ForumPage from '@/components/forum/ForumPage.vue'
import { useHead } from '@unhead/vue'
import { makeMeta } from '@/util/pageHelpers.ts'
import ForumSection from '@/components/forum/ForumSection.vue'
import { useAppErrorStore } from '@/stores/appError.ts'

const props = defineProps<{ routeParams: ForumRoute; pageStr?: string }>()
const page = computed(() => pageFromPath(props.pageStr))

const { data: rootForums, suspense: forumsSuspense } = useRootForums()

const forum = computed(() => {
  const forumPathCopy = [...props.routeParams.forumPath]
  let forums = rootForums.value
  while (forumPathCopy.length > 1) {
    if (!forums) {
      return null
    }

    const forumSlug = forumPathCopy.shift()
    const forum = forums.find((forum) => forum.slug === forumSlug)
    forums = forum?.subForums
  }

  const lastForumSlug = forumPathCopy.shift()
  return forums?.find((forum) => forum.slug === lastForumSlug) ?? null
})

const { data: topics, suspense: topicsSuspense } = useTopics(
  computed(() => forum.value?.id),
  computed(() => ({ page: page.value, sortBy: 'dateLastUpdate', order: 'desc' })),
)

// A forum that requires staff/admin is simply absent from the permission-filtered tree, so
// once the tree has loaded, a missing forum means either "no access" or "doesn't exist", which
// both surface as a not-found page. This also avoids awaiting `topicsSuspense()` below,
// which would otherwise never resolve because the topics query stays disabled while
// `forum` is null.
const appErrorStore = useAppErrorStore()
const forumMissing = computed(() => rootForums.value !== undefined && !forum.value)

watchEffect(() => {
  if (forumMissing.value) {
    appErrorStore.setStatus(404)
  }
})

onServerPrefetch(async () => {
  await forumsSuspense()
  if (forumMissing.value) {
    appErrorStore.setStatus(404)
  } else {
    await topicsSuspense()
  }
})

useHead(
  makeMeta({
    title: computed(() => `Yukkuricraft forums archive - ${forum.value?.title ?? ''}`),
    description: computed(() => forum.value?.description ?? ''),
    url: computed(() => `/${props.routeParams.forumPath.join('/')}`),
  }),
)
</script>
