<template>
  <div v-if="forum">
    <h1>{{ forum.title }}</h1>
    <p>{{ forum.description }}</p>

    <template v-if="forum.subforums && forum.subforums.length">
      <h2>Sub-Forums</h2>
      <forum-list :forums="forum.subforums" :forum-path="[...forumPath]" :heading-level="3"></forum-list>
    </template>

    <h2>Topics</h2>
    <b-card v-for="topic in getTopics" :key="'topic-' + topic.title" class="mb-1">
      <b-media no-body>
        <b-media-aside>
          <b-img
            rounded
            width="64"
            blank-color="#ccc"
            src="https://forums.yukkuricraft.net/core/image.php?userid=353&thumb=1&dateline=1494369663"
          />
        </b-media-aside>

        <b-media-body>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <router-link :to="{ name: 'posts', params: { forumPathP: [...forumPath, topic.slug] } }">
                <h2 class="h4">{{ topic.title }}</h2>
              </router-link>
              <div class="byline">
                <p>By: {{ topic.poster }} Posted: {{ topic.date }}</p>
              </div>
            </div>

            <small>Responses: {{ formatNumber(topic.responses) }}</small>
          </div>
        </b-media-body>
      </b-media>
    </b-card>
    <b-pagination-nav
      class="mt-3"
      align="center"
      :link-gen="pageLinkGen"
      :number-of-pages="Math.ceil((forum.topicsCount - getStickyTopics.length) / 10)"
      :limit="7"
      use-router
    ></b-pagination-nav>
  </div>
  <div v-else>
    Waiting
    <!-- TODO Errors -->
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { BCard, BMedia, BMediaAside, BMediaBody, BImg, BPaginationNav } from 'bootstrap-vue'
import ForumSection from '../components/ForumSection'
import ForumList from '../components/ForumList'

const format = new Intl.NumberFormat()

export default {
  components: {
    ForumList,
    BCard,
    BMedia,
    BMediaAside,
    BMediaBody,
    BImg,
    BPaginationNav,
    ForumSection,
  },
  props: {
    forumPathP: {
      type: [Array, String],
      required: true,
    },
  },
  computed: {
    ...mapGetters('sections', ['getSections']),
    ...mapGetters('topics', ['getTopics', 'getStickyTopics']),
    page() {
      let maybePage

      if (Array.isArray(this.forumPathP)) {
        maybePage = this.forumPathP[this.forumPathP.length - 1]
      } else {
        const last = this.forumPathP.lastIndexOf('/')
        maybePage = this.forumPathP.slice(last + 1)
      }

      if (this.isPagePart(maybePage)) {
        return parseInt(maybePage)
      } else {
        return 1
      }
    },
    forumPath() {
      if (Array.isArray(this.forumPathP)) {
        if (this.isPagePart(this.forumPathP[this.forumPathP.length - 1])) {
          return this.forumPathP.slice(0, -1)
        }

        return this.forumPathP
      }

      const parts = this.forumPathP.split('/')

      if (this.isPagePart(parts[parts.length - 1])) {
        parts.pop()
      }

      return parts
    },
    forum() {
      const forumPath = [...this.forumPath]

      const sectionSlug = forumPath.shift()
      let forums = this.getSections.find((section) => section.slug === sectionSlug)?.forums

      while (forumPath.length > 1) {
        if (!forums) {
          return null
        }

        const forumSlug = forumPath.shift()
        const forum = forums.find((forum) => forum.slug === forumSlug)
        forums = forum?.subforums
      }

      const lastForumSlug = forumPath.shift()
      return forums?.find((forum) => forum.slug === lastForumSlug) ?? null
    },
  },
  watch: {
    forumPath: {
      immediate: true,
      async handler(newVal) {
        await this.loadTopics({ forumPath: newVal, page: this.page })
      },
    },
    async page(newVal) {
      await this.loadTopics({ forumPath: this.forumPath, page: newVal })
    },
  },
  async created() {
    await this.loadSections()
  },
  methods: {
    ...mapActions('sections', ['loadSections']),
    ...mapActions('topics', ['loadTopics']),
    formatNumber(num) {
      return format.format(num)
    },
    pageLinkGen(newPage) {
      return {
        name: 'forum',
        params: {
          forumPathP: newPage === 1 ? this.forumPath : [...this.forumPath, `${newPage}page`],
        },
      }
    },
    isPagePart(part) {
      return /\d+page/gm.test(part)
    },
  },
}
</script>
