<template>
  <div>
    <h1 v-if="currentTopic" class="title is-2">
      <!-- TODO Using these properties is wrong, as it will only ever load from a cold state, where it will use the id -->
      <FontAwesomeIcon
        v-show="showSpinner(topicStore.topicsEvaluating, topicStore.topicsRequestedAt)"
        spin
        :icon="faSpinner"
      />
      {{ currentTopic.title }}
    </h1>

    <div
      v-show="showSpinner(postsStore.evaluating, postsStore.requestedAt)"
      style="text-align: center; margin-top: 20vh; margin-bottom: 20vh"
    >
      <FontAwesomeIcon size="6x" spin :icon="faSpinner" />
    </div>
    <ForumPost v-for="post in postsStore.posts" :post="post" :key="'post-' + post.id" />

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
import { computed, onServerPrefetch, watch } from 'vue'
import Pagination from '../components/AutoPagination.vue'
import { pageFromPath } from '../pathUtils'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import ForumPost from '@/components/ForumPost.vue'
import { useTopicsStore } from '@/stores/topics.ts'
import { usePostsStore } from '@/stores/posts.ts'
import { useUsersStore } from '@/stores/users.ts'
import { useRouter } from 'vue-router'

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

const topicStore = useTopicsStore()
const postsStore = usePostsStore()
const usersStore = useUsersStore()

const router = useRouter()

onServerPrefetch(async () => {
  // TODO
  // await topicStore.selectedPromise
  await postsStore.promise
  await Promise.all(Object.values(usersStore.users).map((user) => user.promise))
})

watch(
  computed(() => props.topicId),
  async () => {
    console.log(props.topicId)
    const res = await topicStore.selectFromId(props.topicId)
    if (res) {
      await router.replace(res)
    }
  },
  { immediate: true },
)

watch(
  page,
  () => {
    topicStore.params.page = page.value
  },
  { immediate: true },
)

function showSpinner(loading: boolean, requestedAt: number) {
  return loading && Date.now() - requestedAt < 250
}

const currentTopic = computed(() => topicStore.selectedTopic)

usersStore.watchUserArray(computed(() => postsStore.posts.flatMap((p) => (p.creatorid !== null ? [p.creatorid] : []))))
</script>
