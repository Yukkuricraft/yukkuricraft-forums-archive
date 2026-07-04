<template>
  <div class="is-relative">
    <slot />
    <Transition name="loading-overlay-fade">
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

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
