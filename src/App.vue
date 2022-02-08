<template>
  <div id="app">
    <div class="site">
      <navbar />

      <div class="site-content">
        <b-container class="container-pad">
          <b-breadcrumb v-if="breadcrumbItems.length" :items="breadcrumbItems" /> <!-- TODO: Seems to break with 4 items or more -->
          <router-view></router-view>
        </b-container>
      </div>

      <footer class="yc-footer">
        <p>
          Yukkuricraft and affiliated services are made possible by the generous donations by players like you. Consider
          supporting us through <a href="https://www.patreon.com/remi_scarlet">Patreon</a>.
        </p>

        <p>&copy; Yukkuricraft</p>
      </footer>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import {BContainer, BBreadcrumb} from "bootstrap-vue"
import Navbar from "./components/Navbar";

export default {
  components: {
    Navbar,
    BContainer,
    BBreadcrumb
  },
  computed: {
    ...mapGetters('sections', ['getSections']),
    ...mapGetters('topics', ['getCurrentTopic']),
    breadcrumbItems() {
      const strPath = this.$store.state.route.path
      if (strPath === '/') {
        return []
      }
      const path = strPath.split('/').slice(2)

      if (/\d+page/gm.test(path[path.length - 1])) {
        path.pop()
      }

      const res = []
      res.push({
        text: 'Home',
        to: { name: 'home' }
      })

      const sectionSlug = path.shift()
      const section = this.getSections?.find(section => section.slug === sectionSlug)
      res.push({
        text: section?.title ?? sectionSlug,
        to: { name: 'section', params: { sectionSlug } }
      })

      let forumPath = [sectionSlug]
      let forums = section?.forums
      while (path.length) {
        const forumSlug = path.shift()
        forumPath.push(forumSlug)

        if (/^\d+/gm.test(forumSlug)) {
          res.push({
            text: this.getCurrentTopic?.title ?? forumSlug,
            to: { name: 'posts', params: { forumPathP: [...forumPath] }}
          })
          break
        }

        const forum = forums?.find(forum => forum.slug === forumSlug)
        forums = forum?.subforums

        res.push({
          text: forum?.title ?? forumSlug,
          to: { name: 'forum', params: { forumPathP: [...forumPath] }}
        })
      }

      return res
    },
  },
  async created() {
    await this.loadSections()
  },
  methods: {
    ...mapActions('sections', ['loadSections']),
  }
}
</script>