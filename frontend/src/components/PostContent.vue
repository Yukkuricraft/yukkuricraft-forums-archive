<template>
  <BbcodeRenderer class="content" :content="content" />
</template>

<script setup lang="ts">
import { computed, onErrorCaptured } from 'vue'
import { BbcodeRenderer } from '@/components/BbcodeRenderer.tsx'

const props = defineProps<{
  content: string
}>()
const lines = computed(() => props.content.split('\n').slice(1))

onErrorCaptured((hook, target) => {
  console.log('ERROR', hook, target)
  console.log(lines.value)
  console.log(props.content)
  //console.log(bbcode(props.content, [customPreset(), lineBreakPlugin()]))
  return false
})
</script>
