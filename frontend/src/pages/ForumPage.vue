<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-end">
      <div>
        <h1 class="title">{{ forum.title }}</h1>
        <p class="subtitle">{{ decodeHtmlEntities(forum.description) }}</p>
      </div>

      <div class="field has-addons">
        <div class="control">
          <div class="select">
            <select v-model="sortBy">
              <option value="dateLastUpdate">Last update</option>
              <option value="dateStartedPost">Creation date</option>
              <option value="replies">Replies</option>
              <option value="title">Title</option>
              <option v-if="false" value="members">Members</option>
              <!-- TODO: Show when we implement this -->
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

    <StickyTopics ref="stickyTopics" :route-params="routeParams" :forum="forum" :sort-by="sortBy" :order="order" />
    <TopicsList :route-params="routeParams" :forum="forum" :page="page" :sort-by="sortBy" :order="order" />

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
import ForumList from '../components/ForumList.vue'
import Pagination from '../components/AutoPagination.vue'
import { pageCount } from '../util/pathUtils.ts'
import StickyTopics from '@/components/StickyTopics.vue'
import TopicsList from '@/components/TopicsList.vue'
import type { TopicsOrderingRequestParams } from '@/stores/topics.ts'
import type { ForumRoute } from '@/util/RouteTypes.ts'
import { decode as decodeHtmlEntities } from 'html-entities'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'

const props = defineProps<{ routeParams: ForumRoute; page: number; forum: ForumTree }>()

const stickyTopicsRef = ref<InstanceType<typeof StickyTopics>>()

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
