<template>
  <div>
    <router-link :to="{name: 'section', params: { sectionSlug: section.slug }}">
      <configurable-heading :level="headingLevel" class="h3">{{ section.title }}</configurable-heading>
    </router-link>
    <forum-list :forums="section.forums" :forum-path="[section.slug]" :heading-level="headingLevel"></forum-list>
  </div>
</template>

<script>
import ConfigurableHeading from "./ConfigurableHeading";
import ForumList from "./ForumList";

export default {
  components: {
    ForumList,
    ConfigurableHeading,
  },
  props: {
    section: {
      type: Object,
      required: true
    },
    headingLevel: {
      type: Number,
      required: true,
    },
  },
}
</script>
