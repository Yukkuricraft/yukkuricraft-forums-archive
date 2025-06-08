<template>
  <div v-if="forum">
    <h1 class="title">{{ forum.title }}</h1>
    <p class="subtitle">{{ forum.description }}</p>

    <div v-if="forum.subForums && forum.subForums.length" class="panel">
      <h2 class="panel-heading mt-3">Sub-Forums</h2>
      <ForumList
        :section-slug="sectionSlug"
        :forums="forum.subForums"
        :forum-path="forumPath"
        :heading-level="3"
      ></ForumList>
    </div>

    <h2 v-if="stickyTopics.length" class="title is-4 mt-3">Sticky topics</h2>
    <div v-show="showSpinner(stickyTopicsLoading, stickyTopicsRequestedAt)" style="text-align: center; margin-top: 10vh; margin-bottom: 10vh">
      <FontAwesomeIcon size="6x" spin :icon="faSpinner" />
    </div>
    <Topic
      v-for="topic in stickyTopics"
      :key="'stickytopic-' + topic.title"
      :topic="topic"
      :section-slug="sectionSlug"
      :forum-path="forumPath"
    />

    <h2 class="title is-4 mt-3">Topics</h2>
    <div v-show="showSpinner(topicsLoading, stickyTopicsRequestedAt)" style="text-align: center; margin-top: 10vh; margin-bottom: 10vh">
      <FontAwesomeIcon size="6x" spin :icon="faSpinner" />
    </div>
    <Topic
      v-for="topic in topics"
      :key="'topic-' + topic.title"
      :section-slug="sectionSlug"
      :forum-path="forumPath"
      :topic="topic"
    />
    <Pagination :current-page="page" :page-count="pageCount(forum.topicsCount - stickyTopics.length, 10)" :link-gen="pageLinkGen" :shown-pages="9" />
  </div>
  <div v-else>
    Waiting
    <!-- TODO Errors -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ForumList from '../components/ForumList.vue'
import Pagination from '../components/AutoPagination.vue'
import { pageFromPath } from '../pathUtils'
import Topic from '../components/TopicSummary.vue'
import { type TopicsRequestParams, useForumForums, useStickyTopics, useTopics } from '../dataComposables'
import { pageCount } from '@/util/pageCount.ts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

const props = defineProps<{ sectionSlug: string; forumPath: string[]; pageStr?: string }>()
const page = computed(() => pageFromPath(props.pageStr))
const params = computed<TopicsRequestParams>(() => ({
  page: page.value,
}))

const pageLinkGen = computed(() => (newPage: number) => ({
  name: 'forum',
  params: {
    sectionSlug: props.sectionSlug,
    forumPath: props.forumPath,
    pageStr: newPage === 1 ? undefined : `page${newPage}`,
  },
}))

const { state: sections } = useForumForums()

const forum = computed(() => {
  if (!sections.value) {
    return null
  }

  const forumPathCopy = [...props.forumPath]

  let forums = sections.value.find((section) => section.slug === props.sectionSlug)?.subForums

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

const { state: topics, isLoading: topicsLoading, requestedAt: topicsRequestedAt } = useTopics(
  computed(() => forum.value?.id.toString(10) ?? '0'),
  params,
)
const { state: stickyTopics, isLoading: stickyTopicsLoading, requestedAt: stickyTopicsRequestedAt } = useStickyTopics(
  computed(() => forum.value?.id.toString(10) ?? '0'),
  params,
)
function showSpinner(loading: boolean, requestedAt: number) {
  return loading && Date.now() - requestedAt < 250
}
</script>
