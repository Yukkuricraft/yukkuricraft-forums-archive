<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <div>
        <h1 v-if="currentTopic" class="title is-2">{{ currentTopic.title }}</h1>
        <TopicTags v-if="currentTopic" :tags="currentTopic.tags" />
      </div>
      <div>
        <div class="field">
          <label class="label is-sr-only">Search</label>
          <div class="control">
            <input v-model="search" class="input" type="text" placeholder="Search..." />
          </div>
        </div>
      </div>
    </div>

    <LoadingOverlay :active="postsFetching">
      <ForumPost
        v-for="post in posts"
        :key="'post-' + post.id"
        :post="post"
        :poll="currentTopic?.poll && currentTopic.poll.postId === post.id ? currentTopic.poll : undefined"
        :page-props="props"
      />

      <p v-if="posts && posts.length === 0" class="has-text-grey py-4">No posts match your search.</p>

      <Pagination
        v-if="postsCount"
        :current-page="page"
        :page-count="Math.ceil(postsCount.posts / 10)"
        :link-gen="pageLinkGen"
        :shown-pages="9"
      />
    </LoadingOverlay>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { FetchError } from 'ofetch'
import { computed, onServerPrefetch, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import ForumPost from '~/components/forum/ForumPost.vue'
import LoadingOverlay from '~/components/LoadingOverlay.vue'
import TopicTags from '~/components/topic/TopicTags.vue'
import useUnknownObject, { usePostPage, usePosts, usePostsCount, useTopic } from '~/composables/apiComposables.js'
import { useAppErrorStore } from '~/stores/appError.js'
import { useTopicsStore } from '~/stores/topics.js'
import { useStandardHead } from '~/util/pageHelpers'
import { pageFromPath } from '~/util/pathUtils'
import type { TopicRoute } from '~/util/RouteTypes.js'

import Pagination from '../../../components/AutoPagination.vue'

const props = defineProps<{
  routeParams: TopicRoute
  topicId: string
  topic: string
  pageStr?: string
}>()
const search = ref('')
const page = computed(() => pageFromPath(props.pageStr))

const debouncedSearch = refDebounced(search, 500)

const pageLinkGen = computed(
  () =>
    function (newPage: number) {
      return {
        name: 'posts',
        params: {
          ...props.routeParams,
          topicId: props.topicId,
          pageStr: newPage === 1 ? undefined : `page${newPage}`,
        },
      }
    },
)

const topicStore = useTopicsStore()

const {
  data: posts,
  suspense: suspensePosts,
  isFetching: postsFetching,
} = usePosts(
  computed(() => props.topicId),
  computed(() => ({ page: page.value, pageSize: 10, q: debouncedSearch.value })),
)
const { data: postsCount, suspense: suspensePostsCount } = usePostsCount(
  computed(() => props.topicId),
  computed(() => ({ q: debouncedSearch.value })),
)
const {
  data: currentTopic,
  suspense: suspenseTopic,
  failureReason: topicFailureReason,
  isStale: topicIsStale,
} = useTopic(
  computed(() => props.topicId),
  computed(() => topicStore.currentTopic),
)

const appErrorStore = useAppErrorStore()

onServerPrefetch(async () => {
  await Promise.all([suspensePosts(), suspenseTopic(), suspensePostsCount()])
  // A missing/deleted/inaccessible topic comes back as a 404. Resolve where (if anywhere)
  // it should redirect before rendering, so SSR can show the not-found page directly.
  if (topicFailureReason.value instanceof FetchError && topicFailureReason.value.status === 404) {
    await unknownObjectSuspense()
    if (!unknownObjectRoute.value) {
      appErrorStore.setStatus(404)
    }
  }
})

watchEffect(() => {
  if (currentTopic.value) {
    topicStore.currentTopic = currentTopic.value
  }
})

// A redirect topic has no posts of its own. Navigating to it directly should forward to its target.
const redirectRoute = computed<RouteLocationRaw | null>(() => {
  const redirectTo = currentTopic.value?.redirectTo
  if (redirectTo) {
    return {
      name: 'posts',
      params: { forumPath: redirectTo.forumSlug, topic: redirectTo.slug, topicId: redirectTo.id },
    }
  }

  return null
})

const actualTopicRoute = computed<RouteLocationRaw | null>(() => {
  if (!topicIsStale && currentTopic.value && currentTopic.value.slug !== props.routeParams.topic) {
    return {
      name: 'posts',
      params: {
        ...props.routeParams,
        topicId: currentTopic.value.id,
        topic: currentTopic.value.slug,
        pageStr: page.value === 1 ? undefined : `page${page.value}`,
      },
    }
  }

  return null
})

const {
  route: unknownObjectRoute,
  isSettled: unknownObjectSettled,
  suspense: unknownObjectSuspense,
} = useUnknownObject(
  computed(() => props.topicId),
  topicFailureReason,
  () => topicFailureReason.value instanceof FetchError && topicFailureReason.value.status === 404,
)

const router = useRouter()

watch(
  [redirectRoute, actualTopicRoute],
  async ([redirect, actual]) => {
    const v = redirect ?? actual
    if (v) {
      await router.replace(v)
    }
  },
  { immediate: true },
)

watchEffect(async () => {
  const unknownRoute = unknownObjectRoute.value

  if (unknownRoute) {
    await router.replace(unknownRoute)
  } else if (
    topicFailureReason.value instanceof FetchError &&
    topicFailureReason.value.status === 404 &&
    unknownObjectSettled.value
  ) {
    appErrorStore.setStatus(404)
  }
})

const route = useRoute()

// A ?p= permalink references a post by id. The post may live on a different page than
// the one being viewed, so resolve its page and redirect there
const targetPostId = computed(() => {
  const p = route.query.p
  const n = typeof p === 'string' ? Number(p) : NaN
  return Number.isInteger(n) ? n : undefined
})

const postOnCurrentPage = computed(
  () => targetPostId.value != null && Boolean(posts.value?.some((post) => post.id === targetPostId.value)),
)

// Only hit the backend once posts have loaded and the target isn't already on this page
const postToResolve = computed(() =>
  targetPostId.value != null && posts.value != null && !postOnCurrentPage.value ? targetPostId.value : undefined,
)

const { data: targetPostPage } = usePostPage(
  computed(() => props.topicId),
  postToResolve,
  10,
)

watch(
  [targetPostPage, postToResolve],
  async ([resolved, toResolve]) => {
    if (toResolve != null && resolved && resolved.page !== page.value) {
      await router.replace({
        name: 'posts',
        params: {
          ...props.routeParams,
          topicId: props.topicId,
          pageStr: resolved.page === 1 ? undefined : `page${resolved.page}`,
        },
        query: { p: String(toResolve) },
        hash: `#post${toResolve}`,
      })
    }
  },
  { immediate: true },
)

function first(str: string | string[]): string {
  return Array.isArray(str) ? str[0] : str
}

function arr(str: string | string[]): string[] {
  return Array.isArray(str) ? str : [str]
}

useStandardHead({
  title: () => `${currentTopic.value?.title}`,
  url: () =>
    `/${props.routeParams.forumPath.join('/')}/${props.topicId}-${props.topic}${props.pageStr ? `/${props.pageStr}` : ''}`,
  description: () => '',
})

definePageMeta({
  path: `/:forumPath((?!page\\d+\\)(?!member\\)[^/]+)+/:topicId(\\d+)-:topic?/:pageStr(page\\d+)?`,
  name: 'posts',
  props: (route) => ({
    routeParams: {
      forumPath: arr(route.params.forumPath),
      topic: first(route.params.topic),
    } satisfies TopicRoute,
    topicId: route.params.topicId,
    topic: route.params.topic,
    pageStr: route.params.pageStr,
  }),
})
</script>
