<template>
  <div class="has-text-grey" :class="inline ? 'is-inline-flex is-align-items-center' : 'has-text-centered py-6'">
    <FontAwesomeIcon :icon="faSpinner" spin :size="size" />
    <span v-if="label" class="ml-2">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import type { SizeProp } from '@fortawesome/fontawesome-svg-core'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

withDefaults(
  defineProps<{
    size?: SizeProp
    label?: string
    inline?: boolean
  }>(),
  { size: '2x' },
)
</script>
