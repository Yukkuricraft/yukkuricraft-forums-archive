<template>
  <div v-html="htmlContent"></div>
</template>

<script setup lang="ts">
import markdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

const md = markdownIt({ typographer: true, breaks: true })
const htmlContent = computed(() => md.render(props.content))
</script>
