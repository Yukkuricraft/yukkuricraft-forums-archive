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
            <input class="input" type="text" placeholder="Search..." v-model="search" />
          </div>
        </div>
      </div>
    </div>

    <ForumPost
      v-for="post in posts"
      :key="'post-' + post.id"
      :post="post"
      :poll="currentTopic?.poll && currentTopic.poll.postId === post.id ? currentTopic.poll : undefined"
      :page-props="props"
    />

    <Pagination
      v-if="postsCount"
      :current-page="page"
      :page-count="Math.ceil(postsCount.posts / 10)"
      :link-gen="pageLinkGen"
      :shown-pages="9"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch, ref, watch, watchEffect } from 'vue'
import Pagination from '../components/AutoPagination.vue'
import TopicTags from '@/components/topic/TopicTags.vue'
import { pageFromPath } from '../util/pathUtils.ts'
import ForumPost from '@/components/forum/ForumPost.vue'
import { useTopicsStore } from '@/stores/topics.ts'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { NotFoundError } from '@/util/Api.ts'
import useUnknownObject, { usePostPage, usePosts, usePostsCount, useTopic } from '@/composables/apiComposables.ts'
import { refDebounced } from '@vueuse/core'
import type { TopicRoute } from '@/util/RouteTypes.ts'
import { useAppErrorStore } from '@/stores/appError.ts'

const props = defineProps<{
  routeParams: TopicRoute
  topicId: string
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

const { data: posts, suspense: suspensePosts } = usePosts(
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
  if (topicFailureReason.value instanceof NotFoundError) {
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
  () => topicFailureReason.value instanceof NotFoundError,
)

const router = useRouter()

watch(
  actualTopicRoute,
  async (v) => {
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
  } else if (topicFailureReason.value instanceof NotFoundError && unknownObjectSettled.value) {
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
</script>
