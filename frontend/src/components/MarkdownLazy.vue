<template>
  <MarkdownNow :content="content" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import TextErrorComponent from '@/components/TextErrorComponent.vue'
import TextLoadingComponent from '@/components/TextLoadingComponent.vue'

const MarkdownNow = defineAsyncComponent({
  loader: () => import('./MarkdownNow.vue'),
  loadingComponent: TextLoadingComponent,
  errorComponent: TextErrorComponent,
  delay: 0,
})

defineProps<{ content: string }>()
</script>
