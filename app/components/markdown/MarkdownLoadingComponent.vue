<template>
  <div><FontAwesomeIcon :icon="faSpinner" spin size="3x" /> Loading</div>
</template>

<script setup lang="ts">
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>
