<template>
  <b-list-group class="mb-5">
    <b-list-group-item v-for="forum in forums" :key="'forum-' + forum.title" class="flex-column align-items-start">
      <div class="d-flex w-100 justify-content-between">
        <router-link :to="{ name: 'forum', params: { forumPathP: [...forumPath, forum.slug] } }">
          <configurable-heading :level="headingLevel + 1" class="h4 mb-1">{{ forum.title }}</configurable-heading>
        </router-link>
        <div>
          <small>{{ formatNumber(forum.topicsCount) }} topics / {{ formatNumber(forum.postsCount) }} posts</small>
        </div>
      </div>
      <template v-if="forum.description">
        <p class="mb-1">{{ forum.description }}</p>
      </template>

      <template v-if="forum.subforums && forum.subforums.length">
        <strong>Subforums:</strong>
        <b-list-group horizontal>
          <b-list-group-item
            v-for="subforum in forum.subforums"
            :key="'forum-' + forum.title + '-' + subforum.title"
          >
            <router-link
              :to="{
                name: 'forum',
                params: { forumPathP: [...forumPath, forum.slug, subforum.slug] },
              }"
            >
              {{ subforum.title }}
            </router-link>
            ({{ formatNumber(subforum.topicsCount) }}/{{ formatNumber(subforum.postsCount) }})
          </b-list-group-item>
        </b-list-group>
      </template>
    </b-list-group-item>
  </b-list-group>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue'
import ConfigurableHeading from './ConfigurableHeading'

const format = new Intl.NumberFormat()

export default {
  components: {
    BListGroup,
    BListGroupItem,
    ConfigurableHeading,
  },
  props: {
    forums: {
      type: Array,
      required: true,
    },
    forumPath: {
      type: Array,
      required: true,
    },
    headingLevel: {
      type: Number,
      required: true,
    },
  },
  methods: {
    formatNumber(num) {
      return format.format(num)
    },
  }
}
</script>
