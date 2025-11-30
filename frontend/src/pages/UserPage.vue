<template>
  <div class="user-page-grid" v-if="user">
    <div style="grid-area: header">
      <h1 class="title">User Profile</h1>
    </div>
    <div style="grid-area: main" class="box">
      <MarkdownLazy class="content" v-if="user.biography" :content="user.biography.replaceAll('\r\n', '\n')" />
    </div>
    <div style="grid-area: visitor-messages; margin-bottom: 0" class="box">
      <ForumPost v-for="post in posts" :key="'post-' + post.id" :post="post" />

      <Pagination
        v-if="postsCount"
        :current-page="page"
        :page-count="Math.ceil(postsCount.posts / 10)"
        :navigate-to-page="(p) => (page = p)"
        :shown-pages="9"
      />
    </div>
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
          <p>Joined: {{ localeStore.formatMonthYear(user.createdAt) }}</p>
          <p>Location: {{ user.location && decodeHtmlEntities(user.location) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUser, useVisitorMessages, useVisitorMessagesCount } from '@/composables/apiComposables.ts'
import { computed, onServerPrefetch, ref } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocaleStore } from '@/stores/localization.ts'
import MarkdownLazy from '@/components/markdown/MarkdownLazy.vue'
import Pagination from '@/components/AutoPagination.vue'
import ForumPost from '@/components/forum/ForumPost.vue'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'

const props = defineProps<{
  userId: string
  userName: string
}>()

const { data: user, suspense: userSuspense } = useUser(computed(() => parseInt(props.userId)))

const page = ref(1)

const { data: posts, suspense: suspensePosts } = useVisitorMessages(
  computed(() => props.userId),
  computed(() => ({ page: page.value, pageSize: 10 })),
)
const { data: postsCount, suspense: suspensePostsCount } = useVisitorMessagesCount(computed(() => props.userId))

onServerPrefetch(() => Promise.all([suspensePosts(), suspensePostsCount(), userSuspense()]))

const localeStore = useLocaleStore()
</script>

<style>
.user-page-grid {
  display: grid;
  grid-template-columns: 3fr 9fr;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    'header header'
    'sidebar main'
    'sidebar visitor-messages';
  gap: 1rem;
}
</style>
