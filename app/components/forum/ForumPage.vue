<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-end">
      <div>
        <h1 class="title">{{ forum.title }}</h1>
        <p class="subtitle">{{ forum.description && decodeHtmlEntities(forum.description) }}</p>
      </div>

      <div class="field has-addons">
        <div class="control">
          <div class="select">
            <select v-model="sortBy">
              <option value="dateLastUpdate">Last update</option>
              <option value="dateStartedPost">Creation date</option>
              <option value="replies">Replies</option>
              <option value="title">Title</option>
              <option value="members">Members</option>
            </select>
          </div>
        </div>
        <div class="control">
          <div class="select">
            <select v-model="order">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="forum.subForums && forum.subForums.length" class="panel">
      <h2 class="panel-heading mt-3">Sub-Forums</h2>
      <ForumList :route-params="routeParams" :forums="forum.subForums" :heading-level="3"></ForumList>
    </div>

    <TopicStickyList ref="stickyTopics" :route-params="routeParams" :forum="forum" :sort-by="sortBy" :order="order" />
    <TopicList :route-params="routeParams" :forum="forum" :page="page" :sort-by="sortBy" :order="order" />

    <Pagination
      :current-page="page"
      :page-count="pageCount(forum.topicsCount - (stickyTopicsRef?.stickyTopics?.length ?? 0), 10)"
      :link-gen="pageLinkGen"
      :shown-pages="9"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ForumTree } from '#shared/types/forum'
import TopicList from '@/components/topic/TopicList.vue'
import TopicStickyList from '@/components/topic/TopicStickyList.vue'
import type { TopicsOrderingRequestParams } from '@/stores/topics.js'
import { decodeHtmlEntities } from '@/util/htmlEntities.js'
import { pageCount } from '@/util/pathUtils.js'
import type { ForumRoute } from '@/util/RouteTypes.js'

import Pagination from '../AutoPagination.vue'
import ForumList from './ForumList.vue'

const props = defineProps<{ routeParams: ForumRoute; page: number; forum: ForumTree }>()

const stickyTopicsRef = ref<InstanceType<typeof TopicStickyList>>()

const sortBy = ref<TopicsOrderingRequestParams['sortBy']>('dateLastUpdate')
const order = ref<TopicsOrderingRequestParams['order']>('desc')

const pageLinkGen = computed(() => (newPage: number) => ({
  name: 'forum',
  params: {
    ...props.routeParams,
    pageStr: newPage === 1 ? undefined : `page${newPage}`,
  },
}))
</script>
