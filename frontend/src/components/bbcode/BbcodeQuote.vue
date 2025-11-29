<template>
  <blockquote class="is-flex">
    <FontAwesomeIcon :icon="faQuoteLeft" size="2x" class="pr-3" />
    <div style="flex: 1">
      <template v-if="referencedUser">
        Originally posted by <strong>{{ referencedUser }}</strong>
        <router-link v-if="postReferenceRoute" class="ml-1" :to="postReferenceRoute">
          <FontAwesomeIcon :icon="faLink" />
        </router-link>
        <br />
      </template>
      <slot></slot>
    </div>
  </blockquote>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLink, faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import useUnknownObject from '@/composables/apiComposables.ts'

const props = defineProps<{
  referencedUser?: string | null
  referencedPost?: string | null
}>()

const postReferenceRoute = useUnknownObject(
  computed(() => props.referencedPost),
  '',
)
</script>
