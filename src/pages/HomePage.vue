<template>
  <div>
    <vue-headful
      title="Yukkuricraft forums archive"
      description="The Yukkuricraft forums archive."
      :image="require('../favicon_upscaled.png')"
      url="https://old-forums.yukkuricraft.net/"
    />

    <h1>Yukkuricraft</h1>

    <forum-section
      v-if="sections.length"
      v-for="section in sections"
      :key="'section-' + section.slug"
      :section="section"
      :heading-level="2"
    />
    <template v-else>
      <div>Waiting</div> <!-- TODO: Handle 5xx errors -->
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
  computed: {
    ...mapGetters('sections', {sections: "getSections"}),
  },
  async created() {
    await this.loadSections()
  },
  methods: {
    ...mapActions('sections', ['loadSections']),
  },
}
</script>
