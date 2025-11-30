<template>
  <div><FontAwesomeIcon :icon="faSpinner" spin size="3x" /> Loading</div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
</script>
