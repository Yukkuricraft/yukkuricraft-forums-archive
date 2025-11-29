<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <h1 v-if="currentTopic" class="title is-2">{{ currentTopic.title }}</h1>
      <div>
        <div class="field">
          <label class="label is-sr-only">Search</label>
          <div class="control">
            <input class="input" type="text" placeholder="Search..." v-model="search" />
          </div>
        </div>
      </div>
    </div>

    <ForumPost v-for="post in posts" :key="'post-' + post.id" :post="post" :page-props="props" />

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
import { pageCount, pageFromPath } from '../util/pathUtils.ts'
import ForumPost from '@/components/ForumPost.vue'
import { useTopicsStore } from '@/stores/topics.ts'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { NotFoundError, useApi } from '@/util/Api.ts'
import { usePosts, usePostsCount, useTopic } from '@/composables/apiComposables.ts'
import { useQuery } from '@tanstack/vue-query'
import { refDebounced } from '@vueuse/core'

const props = defineProps<{
  sectionSlug: string
  forumPath: string[]
  topic: string
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
          sectionSlug: props.sectionSlug,
          forumPath: props.forumPath,
          topicId: props.topicId,
          topic: props.topic,
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
} = useTopic(
  computed(() => props.topicId),
  computed(() => topicStore.currentTopic),
)

const api = useApi()

const { data: unknownObject } = useQuery({
  queryKey: ['api', 'unknownObject', computed(() => props.topicId), topicFailureReason],
  queryFn: ({ signal }) => {
    return api.get<
      | { forum: { forumSlug: string[] } }
      | { topic: { forumSlug: string[]; topicSlug: string } }
      | { post: { forumSlug: string[]; topicSlug: string; idx: number } }
    >(`/api/unknownObject/${props.topicId}`, undefined, signal)
  },
  enabled: () => topicFailureReason.value !== null && topicFailureReason.value instanceof NotFoundError,
})

const router = useRouter()

const actualRoute = computed<RouteLocationRaw | null>(() => {
  const res = unknownObject.value
  if (res) {
    console.log(res)

    if ('forum' in res) {
      const parts = [...res.forum.forumSlug]
      if (parts[0] === 'forum') {
        parts.shift()
      } else {
        // TODO
      }

      return {
        name: 'forum',
        params: { sectionSlug: parts[0], forumPath: parts.slice(1) },
      }
    } else if ('topic' in res) {
      const parts = [...res.topic.forumSlug]
      if (parts[0] === 'forum') {
        return null // We should already be here in that case
      } else {
        // TODO
      }
    } else {
      const parts = [...res.post.forumSlug]
      if (parts[0] === 'forum') {
        parts.shift()
      } else {
        // TODO
      }
      const pageSize = 10 // Should be the default

      const page = pageCount(res.post.idx, pageSize)

      return {
        name: 'topic',
        params: {
          sectionSlug: parts[0],
          forumPath: parts.slice(1),
          topicId: props.topicId,
          topic: res.post.topicSlug,
          pageStr: `page${page}`,
        },
        query: { p: props.topicId },
        hash: `#post${props.topicId}`,
      }
    }
  }

  return null
})

onServerPrefetch(async () => {
  await Promise.all([suspensePosts(), suspenseTopic(), suspensePostsCount()])
})

watch(
  currentTopic,
  (t) => {
    if (t) {
      topicStore.currentTopic = t
    }
  },
  { immediate: true },
)

const actualTopicRoute = computed<RouteLocationRaw | null>(() => {
  if (currentTopic.value && currentTopic.value.slug !== props.sectionSlug) {
    return {
      name: 'posts',
      params: {
        sectionSlug: props.sectionSlug,
        forumPath: props.forumPath,
        topicId: currentTopic.value.id,
        topic: currentTopic.value.slug,
        pageStr: page.value === 1 ? undefined : `page${page.value}`,
      },
    }
  }

  return null
})

watch(
  actualTopicRoute,
  async (v) => {
    if (v) {
      await router.replace(v)
    }
  },
  { immediate: true },
)

watchEffect(() => {
  if (actualRoute.value) {
    router.replace(actualRoute.value)
  }
})
</script>
