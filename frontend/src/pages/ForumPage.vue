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

    <StickyTopics ref="stickyTopics" :section-slug="sectionSlug" :forum-path="forumPath" :forum="forum" />
    <TopicsList :section-slug="sectionSlug" :forum-path="forumPath" :forum="forum" :page="page" />

    <Pagination
      :current-page="page"
      :page-count="pageCount(forum.topicsCount - (stickyTopicsRef?.stickyTopics?.length ?? 0), 10)"
      :link-gen="pageLinkGen"
      :shown-pages="9"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch, ref } from 'vue'
import ForumList from '../components/ForumList.vue'
import Pagination from '../components/AutoPagination.vue'
import { pageCount, pageFromPath } from '../util/pathUtils.ts'
import StickyTopics from '@/components/StickyTopics.vue'
import TopicsList from '@/components/TopicsList.vue'
import { useForumForums } from '@/composables/apiComposables.ts'

const props = defineProps<{ sectionSlug: string; forumPath: string[]; pageStr?: string }>()
const page = computed(() => pageFromPath(props.pageStr))

const stickyTopicsRef = ref<InstanceType<typeof StickyTopics>>()

const pageLinkGen = computed(() => (newPage: number) => ({
  name: 'forum',
  params: {
    sectionSlug: props.sectionSlug,
    forumPath: props.forumPath,
    pageStr: newPage === 1 ? undefined : `page${newPage}`,
  },
}))

const { data: forumForums, suspense } = useForumForums()

onServerPrefetch(suspense)

const forum = computed(() => {
  const forumPathCopy = [...props.forumPath]

  let forums = forumForums.value?.find((section) => section.slug === props.sectionSlug)?.subForums

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
</script>
