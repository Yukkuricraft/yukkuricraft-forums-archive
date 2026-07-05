<template>
  <details class="spoiler">
    <summary class="spoiler-text">{{ summary }}</summary>
    <slot></slot>
  </details>
</template>

<script setup lang="ts">
defineProps<{
  summary: string
}>()
</script>

<style scoped>
.spoiler {
  border: 1px solid #aaa;
  border-radius: 4px;
  padding: 0.5em 0.5em 0;
}

.spoiler-text {
  font-weight: bold;
  margin: -0.5em -0.5em 0;
  padding: 0.5em;
}

details.spoiler[open] {
  padding: 0.5em;
}

details.spoiler[open] .spoiler-text {
  border-bottom: 1px solid #aaa;
  margin-bottom: 0.5em;
}
</style>
