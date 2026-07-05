<template>
  <BbcodeRenderer class="content" :content="content" />
</template>

<script setup lang="ts">
import { computed, onErrorCaptured } from 'vue'
import { BbcodeRenderer } from '@/components/bbcode/BbcodeRenderer.tsx'

const props = defineProps<{
  content: string
}>()
const lines = computed(() => props.content.split('\n').slice(1))

onErrorCaptured((hook, target) => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- import.meta.env.DEV is a Vite built-in, not an env var
  if (import.meta.env.DEV) {
    console.log('ERROR', hook, target)
    console.log(lines.value)
    console.log(props.content)
  }
  return false
})
</script>
