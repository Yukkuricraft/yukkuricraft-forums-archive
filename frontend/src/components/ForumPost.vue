<template>
  <div class="card">
    <div class="card-content">
      <div class="media">
        <div class="media-left" style="max-width: 128px; margin-right: 2rem">
          <div class="text-center">
            <UserAvatar
              :width="128"
              :user-id="post.creatorId"
              :user-name="creator?.name"
              :has-avatar="Boolean(creator?.avatarId)"
              :thumbnail="false"
            />
            <p>
              <strong><UserLink :user="creator ?? null" /></strong>
            </p>
            <p :style="{ color: creator?.UserGroup?.color ?? undefined }">
              <span :style="{ color: creator?.titleColor ?? undefined, opacity: creator?.titleOpacity ?? undefined }">
                {{ creator?.title ?? creator?.UserGroup?.userTitle }}
              </span>
            </p>
            <p>
              Join Date: {{ localeStore.formatMonthYear(creator?.createdAt) }}
              <br />
              Posts: {{ creator?.postCount }}
            </p>
          </div>
        </div>

        <!-- I don't know why, but setting the width to a value lower than 100 fixes styling isues with long code blocks -->
        <div class="media-content" style="width: 80%">
          <div class="is-flex is-justify-content-space-between">
            <small class="is-size-7">{{ localeStore.formatDate(post.createdAt) }}</small>
            <router-link
              :to="{ name: 'posts', params: pageProps, query: { p: post.id }, hash: `#post${post.id}` }"
            >
              #{{ post.idx }}
            </router-link>
          </div>

          <PostContent :content="post.content" />
          <template v-if="post.postEditCreatedAt || post.postEditCreatorId || post.postEditReason">
            <i
              >Last edited by <UserLink :user="lastEditUser ?? null"></UserLink>;
              {{ localeStore.formatDate(post.postEditCreatedAt) }}.
              <span v-if="post.postEditReason">Reason: {{ post.postEditReason }}</span>
            </i>
          </template>
          <hr />
          <div>
            <PostContent :content="creator?.signature ?? ''"></PostContent>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@yukkuricraft-forums-archive/types/post'
import PostContent from '@/components/PostContent.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed, onServerPrefetch } from 'vue'
import UserLink from '@/components/UserLink.vue'
import { useLocaleStore } from '@/stores/localization.ts'
import { useUser } from '@/composables/apiComposables.ts'

const localeStore = useLocaleStore()

const props = defineProps<{
  post: Post
  pageProps: {
    sectionSlug: string
    forumPath: string[]
    topic: string
    topicId: string
    pageStr?: string
  }
}>()

const { data: creator, suspense: creatorSuspense } = useUser(computed(() => props.post.creatorId))
const { data: lastEditUser, suspense: lastEditUserSuspense } = useUser(computed(() => props.post.postEditCreatorId))

onServerPrefetch(async () => {
  await creatorSuspense()
  await lastEditUserSuspense()
})
</script>
