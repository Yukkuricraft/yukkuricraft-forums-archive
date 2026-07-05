<template>
  <div class="error-state has-text-centered">
    <FontAwesomeIcon :icon="icon" class="error-state-icon mb-4" />
    <h1 class="title is-3">{{ title }}</h1>
    <p class="subtitle is-5">{{ message }}</p>
    <div class="buttons is-centered">
      <a v-if="showLogin" class="button is-primary" href="/oauth_callback/discord">Log in with Discord</a>
      <router-link class="button" :to="{ name: 'home' }">Return home</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { faLock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'

import { useActiveUser } from '@/composables/apiComposables.js'

const props = withDefaults(
  defineProps<{
    status?: number
    title?: string
    message?: string
  }>(),
  { status: 403 },
)

const { data: activeUser } = useActiveUser()

const showLogin = computed(() => props.status === 403 && !activeUser.value)

const icon = computed(() => (props.status === 403 ? faLock : faTriangleExclamation))

const title = computed(() => {
  if (props.title) {
    return props.title
  }
  switch (props.status) {
    case 403:
      return 'Access denied'
    case 404:
      return 'Not found'
    default:
      return 'Something went wrong'
  }
})

const message = computed(() => {
  if (props.message) {
    return props.message
  }
  switch (props.status) {
    case 403:
      return showLogin.value
        ? 'You need to be logged in to view this. It may be restricted to members, staff or administrators.'
        : "You don't have permission to view this. It may be restricted to staff or administrators."
    case 404:
      return "The page or content you're looking for doesn't exist, or has been removed."
    default:
      return 'An unexpected error occurred while loading this page. Please try again later.'
  }
})
</script>

<style scoped>
.error-state {
  margin: 4rem auto;
  max-width: 40rem;
}

.error-state-icon {
  font-size: 3.5rem;
  color: var(--bulma-danger);
}
</style>
