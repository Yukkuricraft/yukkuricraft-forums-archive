<template>
  <div>
    <vue-headful
      title="Yukkuricraft forums archive"
      description="The Yukkuricraft forums archive."
      :image="require('../favicon_upscaled.png')"
      :url="'https://old-forums.yukkuricraft.net/forum/' + sectionSlug"
    />

    <forum-section v-if="getSections.length" :section="section" :heading-level="1" />
    <template v-else>
      <div>Waiting</div>
      <!-- TODO: Handle 404 -->
    </template>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import ForumSection from '../components/ForumSection'

export default {
  components: {
    ForumSection,
  },
  props: {
    sectionSlug: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('sections', ['getSections']),
    section() {
      return this.getSections.find((section) => section.slug === this.sectionSlug)
    },
  },
  async created() {
    await this.loadSections()
  },
  methods: {
    ...mapActions('sections', ['loadSections']),
  },
}
</script>
