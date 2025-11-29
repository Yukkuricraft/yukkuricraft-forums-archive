<template>
  <div class="user-page-grid" v-if="user">
    <div style="grid-area: header" class="block">
      <h1 class="title">User Profile</h1>
    </div>
    <div style="grid-area: main" class="box">
      <MarkdownLazy class="content" v-if="user.biography" :content="user.biography.replaceAll('\r\n', '\n')" />
    </div>
    <div style="grid-area: visitor-messages"></div>
    <div style="grid-area: sidebar">
      <div class="card">
        <div class="card-image">
          <UserAvatar
            :user-id="user.id"
            :user-name="user.name"
            :width="256"
            :has-avatar="Boolean(user.avatarId)"
            :thumbnail="false"
          />
        </div>
        <div class="card-content">
          <h2
            class="title is-3"
            :style="{
              color: user.titleColor ?? user.UserGroup?.color ?? undefined,
              opacity: user.titleOpacity ?? undefined,
            }"
          >
            {{ user.name }}
          </h2>
          <span class="subtitle">{{ user.title ?? user.UserGroup?.userTitle }}</span>
          <p>Joined: {{ localeStore.formatMonthYear(user.createdAt) }}</p>
          <p>Location: {{ user.location }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUser } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocaleStore } from '@/stores/localization.ts'
import MarkdownLazy from '@/components/MarkdownLazy.vue'

const props = defineProps<{
  userId: string
  userName: string
}>()

const { data: user, suspense: userSuspense } = useUser(computed(() => parseInt(props.userId)))

onServerPrefetch(userSuspense)

const localeStore = useLocaleStore()
</script>

<style>
.user-page-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    'header header'
    'sidebar main'
    'sidebar visitor-messages';
}
</style>
