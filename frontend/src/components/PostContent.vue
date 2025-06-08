<template>
  <BbcodeRenderer class="content" :content="content" />
</template>

<script setup lang="ts">
import bbcode from '@bbob/html'
import { computed, onErrorCaptured } from 'vue'
import { BbcodeRenderer, customPreset } from '@/util/BbcodeRenderer.tsx'
import { lineBreakPlugin } from '@/util/lineBreakPlugin.ts'

const props = defineProps<{
  content: string
}>()
const lines = computed(() => props.content.split('\n').slice(1))

onErrorCaptured((hook, target) => {
  console.log('ERROR', hook, target)
  console.log(lines.value)
  console.log(props.content)
  console.log(bbcode(props.content, [customPreset(), lineBreakPlugin()]))
  return false
})
</script>
