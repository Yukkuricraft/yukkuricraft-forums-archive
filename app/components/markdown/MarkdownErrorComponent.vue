<template>
  <div><FontAwesomeIcon class="text-danger" :icon="faTimes" /> Error loading content</div>
</template>

<script setup lang="ts">
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>
