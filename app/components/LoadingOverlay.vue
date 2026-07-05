<template>
  <div class="is-relative">
    <slot />
    <Transition name="loading-overlay-fade">
      <!-- v-show (not v-if) so the node type stays a <div> on both server and client. On an
           errored SSR query the overlay is inactive server-side but the client refetches (active),
           and a v-if here would hydrate a comment against a div. -->
      <div
        v-if="active"
        class="is-overlay is-flex is-justify-content-center is-align-items-flex-start pt-6 loading-overlay"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="loading-overlay-spinner has-text-grey">
          <FontAwesomeIcon :icon="faSpinner" spin size="2x" />
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  active?: boolean
}>()
</script>

<style scoped>
.loading-overlay {
  z-index: 5;
  pointer-events: none;
  background: color-mix(in srgb, var(--bulma-scheme-main) 55%, transparent);
}

.loading-overlay-spinner {
  position: sticky;
  top: 40vh;
}

.loading-overlay-fade-enter-active,
.loading-overlay-fade-leave-active {
  transition: opacity 0.15s ease;
}

.loading-overlay-fade-enter-from,
.loading-overlay-fade-leave-to {
  opacity: 0;
}
</style>
