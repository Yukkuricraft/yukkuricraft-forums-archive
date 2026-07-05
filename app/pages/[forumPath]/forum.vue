<template>
  <ForumSection v-if="topics?.length === 0 && forum" :route-params="routeParams" :forum="forum" :heading-level="1" />
  <ForumPage v-else-if="forum" :route-params="routeParams" :page="page" :forum="forum" />
</template>

<script setup lang="ts">
import { computed, onServerPrefetch, watchEffect } from 'vue'

import ForumPage from '~/components/forum/ForumPage.vue'
import ForumSection from '~/components/forum/ForumSection.vue'
import { useRootForums, useTopics } from '~/composables/apiComposables.js'
import { useAppErrorStore } from '~/stores/appError.js'
import { makeMeta } from '~/util/pageHelpers.js'
import { pageFromPath } from '~/util/pathUtils.js'
import type { ForumRoute } from '~/util/RouteTypes.js'

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

function arr(str: string | string[]): string[] {
  return Array.isArray(str) ? str : [str]
}

definePageMeta({
  name: 'forum',
  path: `/:forumPath((?!page\\d+\\)(?!member\\)[^/]+)+/:pageStr(page\\d+)?`,
  props: (route) => ({
    routeParams: {
      forumPath: arr(route.params.forumPath),
    } satisfies ForumRoute,
    pageStr: route.params.pageStr,
  }),
})
</script>
