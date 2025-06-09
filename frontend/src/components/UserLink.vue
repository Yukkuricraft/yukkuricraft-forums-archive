<template>
  <router-link v-if="user" :to="{ name: 'user', params: { userId: user.id, userName: user.name } }">{{
    user.name
  }}</router-link>
  <span v-else>Unknown</span>
</template>

<script setup lang="ts">
import type { User } from '@yukkuricraft-forums-archive/types/user'

defineProps<{ user: User | null }>()
</script>
