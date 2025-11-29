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
import useUnknownObject, { usePosts, usePostsCount, useTopic } from '@/composables/apiComposables.ts'
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

const actualRoute = useUnknownObject(
  computed(() => props.topicId),
  topicFailureReason,
  () => topicFailureReason.value !== null && topicFailureReason.value instanceof NotFoundError,
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

watchEffect(() => {
  if (actualRoute.value) {
    router.replace(actualRoute.value)
  }
})
</script>
