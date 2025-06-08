<template>
  <div>
    <h1 v-if="currentTopic" class="title is-2">
      <FontAwesomeIcon v-show="showSpinner(topicLoading, topicRequestedAt)" spin :icon="faSpinner" />
      {{ currentTopic.title }}
    </h1>

    <div
      v-show="showSpinner(postsLoading, postsRequestedAt)"
      style="text-align: center; margin-top: 20vh; margin-bottom: 20vh"
    >
      <FontAwesomeIcon size="6x" spin :icon="faSpinner" />
    </div>
    <ForumPost v-for="post in posts" :post="post" :key="'post-' + post.id" />

    <Pagination
      v-if="currentTopic"
      :current-page="page"
      :page-count="Math.ceil(currentTopic.postCount / 10)"
      :link-gen="pageLinkGen"
      :shown-pages="9"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Pagination from '../components/AutoPagination.vue'
import { pageFromPath } from '../pathUtils'
import { usePosts, useTopic, useUsers } from '../dataComposables'
import { useRoute, useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import ForumPost from '@/components/ForumPost.vue'

const props = defineProps<{
  sectionSlug: string
  forumPath: string[]
  topic: string
  topicId: string
  pageStr?: string
}>()
const page = computed(() => pageFromPath(props.pageStr))
const pageLinkGen = computed(
  () =>
    function (newPage: number) {
      return {
        name: 'posts',
        params: {
          sectionSlug: props.sectionSlug,
          forumPath: props.forumPath,
          topic: props.topic,
          pageStr: newPage === 1 ? undefined : `page${newPage}`,
        },
      }
    },
)

const {
  state: gottenTopic,
  isLoading: topicLoading,
  requestedAt: topicRequestedAt,
} = useTopic(computed(() => props.topicId))
const {
  state: posts,
  isLoading: postsLoading,
  requestedAt: postsRequestedAt,
} = usePosts(
  computed(() => props.topicId),
  page,
)

function showSpinner(loading: boolean, requestedAt: number) {
  return loading && Date.now() - requestedAt < 250
}

const currentTopic = computed(() => gottenTopic.value[0])
const redirect = computed(() => gottenTopic.value[1])

const router = useRouter()
const route = useRoute()
watch(currentTopic, () => {
  const topic = currentTopic.value
  if (topic) {
    const topicSlug = topic.slug
    const fullSlug = `${topic.id}-${topicSlug}`
    if (props.sectionSlug !== fullSlug) {
      router.replace({
        name: 'posts',
        hash: route.hash,
        params: { ...route.params, topic: topicSlug },
        query: route.query,
        replace: true,
      })
    }
  }
})

const creatorIds = computed(() => posts.value.flatMap((p) => (p.creatorid !== null ? [p.creatorid] : [])))
const users = useUsers(creatorIds)

function creator(id: number | null) {
  if (id === null) {
    return null
  }

  const user = users.value[id]
  if (!user || !user.state) {
    return null
  }

  return user.state.value
}

watch(redirect, () => {
  if (redirect.value) {
    router.replace(redirect.value)
  }
})
</script>
