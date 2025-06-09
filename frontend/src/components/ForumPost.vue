<template>
  <div class="card">
    <div class="card-content">
      <div class="media">
        <div class="media-left" style="max-width: 128px; margin-right: 2rem">
          <div class="text-center">
            <UserAvatar
              :width="128"
              :user-id="post.creatorid"
              :user-name="creator?.name"
              :has-avatar="Boolean(creator?.avatarId)"
              :thumbnail="false"
            />
            <p>
              <strong><UserLink :user="creator" /></strong>
            </p>
            <p :style="{ color: creator?.UserGroup?.color ?? undefined }">
              <span v-html="creator?.title ?? creator?.UserGroup?.userTitle"></span>
              <!-- TODO: Extract out HTML from title in DB -->
            </p>
            <p>
              Join Date: {{ formatJoinDate(creator?.createdAt as unknown as string) }}
              <br />
              Posts: {{ creator?.postCount }}
            </p>
          </div>
        </div>

        <!-- I don't know why, but setting the width to a value lower than 100 fixes styling isues with long code blocks -->
        <div class="media-content" style="width: 80%">
          <div class="is-flex is-justify-content-space-between">
            <small class="is-size-7">{{ formatDateStr(post.createdat as unknown as string) }}</small>
            <router-link :to="{ name: 'posts', query: { p: post.id }, hash: `#post${post.id}` }"
              >#{{ post.idx }}</router-link
            >
          </div>

          <PostContent :content="post.content" />
          <template v-if="post.posteditcreatedat || post.posteditcreatorid || post.posteditreason">
            <i
              >Last edited by <UserLink :user="lastEditUser"></UserLink>;
              {{ formatDateStr(post.posteditcreatedat as unknown as string) }}.
              <span v-if="post.posteditreason">Reason: {{ post.posteditreason }}</span>
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
import { useUsersStore } from '@/stores/users.ts'

const userStore = useUsersStore()

const props = defineProps<{
  post: Post
}>()

onServerPrefetch(async () => {
  await Promise.all(Object.values(userStore.users).map((user) => user.promise))
})

const joinDateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' })
function formatJoinDate(str: string): string {
  if (!str) return ''

  return joinDateFormat.format(new Date(str))
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
function formatDateStr(date: string) {
  return dateFormat.format(new Date(date))
}

const creator = userStore.useUser(computed(() => props.post.creatorid))
const lastEditUser = userStore.useUser(computed(() => props.post.posteditcreatorid))
</script>
