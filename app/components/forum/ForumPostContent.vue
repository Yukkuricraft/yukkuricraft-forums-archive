<template>
  <BbcodeRenderer class="content" :content="content" />
</template>

<script setup lang="ts">
import { computed, onErrorCaptured } from 'vue'

import { BbcodeRenderer } from '@/components/bbcode/BbcodeRenderer.jsx'

const props = defineProps<{
  content: string
}>()
const lines = computed(() => props.content.split('\n').slice(1))

onErrorCaptured((hook, target) => {
  if (import.meta.dev) {
    console.log('ERROR', hook, target)
    console.log(lines.value)
    console.log(props.content)
  }
  return false
})
</script>
