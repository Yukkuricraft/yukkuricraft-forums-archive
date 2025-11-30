<template>
  <MarkdownNow :content="content" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import MarkdownErrorComponent from '@/components/markdown/MarkdownErrorComponent.vue'
import MarkdownLoadingComponent from '@/components/markdown/MarkdownLoadingComponent.vue'

const MarkdownNow = defineAsyncComponent({
  loader: () => import('./MarkdownNow.vue'),
  loadingComponent: MarkdownLoadingComponent,
  errorComponent: MarkdownErrorComponent,
  delay: 0,
})

defineProps<{ content: string }>()
</script>
