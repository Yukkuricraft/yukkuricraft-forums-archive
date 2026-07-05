<template>
  <router-link v-if="route" :to="route">
    <slot>{{ fallbackLabel }}</slot>
  </router-link>
  <span v-else
    ><slot>{{ fallbackLabel }}</slot></span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useUnknownObject from '@/composables/apiComposables.js'

const props = defineProps<{
  postId?: string | number | null
}>()

const { route } = useUnknownObject(
  computed(() => (props.postId === '' ? null : (props.postId ?? null))),
  '',
)

const fallbackLabel = computed(() => (props.postId != null && props.postId !== '' ? `Post #${props.postId}` : 'Post'))
</script>
