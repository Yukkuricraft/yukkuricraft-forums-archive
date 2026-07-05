<template>
  <div v-if="user" class="user-page-grid">
    <div style="grid-area: sidebar">
      <div class="card" style="height: 100%">
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
          <p>Posts: {{ user.postCount }}</p>
          <p v-if="user.createdAt">Joined: {{ localeStore.formatMonthYear(user.createdAt) }}</p>
          <p v-if="user.location">Location: {{ decodeHtmlEntities(user.location) }}</p>
        </div>
      </div>
    </div>

    <div style="grid-area: header">
      <h1 class="title">{{ user.name }}</h1>
      <div class="tabs">
        <ul>
          <li v-for="t in tabs" :key="t.key" :class="{ 'is-active': tab === t.key }">
            <a @click="tab = t.key">{{ t.label }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div style="grid-area: content">
      <UserActivityTab v-if="tab === 'activity'" :user-name="user.name" />
      <UserVisitorMessagesTab v-else-if="tab === 'visitor-messages'" :user-id="user.id" />
      <UserAboutTab v-else :user="user" @navigate-to-visitor-messages="tab = 'visitor-messages'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue'
import z from 'zod'

import UserAboutTab from '~/components/user/UserAboutTab.vue'
import UserActivityTab from '~/components/user/UserActivityTab.vue'
import UserVisitorMessagesTab from '~/components/user/UserVisitorMessagesTab.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useUser } from '~/composables/apiComposables.js'
import { useSchemaRouteQuery } from '~/composables/routeComposables.js'
import { useLocaleStore } from '~/stores/localization.js'
import { decodeHtmlEntities } from '~/util/htmlEntities.js'
import { useStandardHead } from '~/util/pageHelpers'

const props = defineProps<{
  userId: string
  userName: string
}>()

const tabs = [
  { key: 'activity', label: 'Activity' },
  { key: 'visitor-messages', label: 'Visitor Messages' },
  { key: 'about', label: 'About Me' },
] as const

const tab = useSchemaRouteQuery(
  'tab',
  z.enum(['activity', 'visitor-messages', 'about']).catch('activity'),
  (v) => v,
  'activity',
)

const { data: user, suspense: userSuspense } = useUser(computed(() => parseInt(props.userId)))

// Resolve the user before rendering; each tab component then prefetches its own
// data during the SSR render walk once `v-if="user"` lets it mount.
onServerPrefetch(userSuspense)

const localeStore = useLocaleStore()

useStandardHead({
  title: () => props.userName,
  url: () => `/member/${props.userId}-${props.userName}`,
  description: () => `User profile for ${props.userName}`,
})

definePageMeta({ name: 'user', props: true })
</script>

<style>
.user-page-grid {
  display: grid;
  grid-template-columns: 3fr 9fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'sidebar header'
    'sidebar content';
  gap: 1rem;
}

.user-page-grid .tabs {
  margin-bottom: 0;
}

.user-page-grid .tabs a:not([href]) {
  cursor: pointer;
}
</style>
