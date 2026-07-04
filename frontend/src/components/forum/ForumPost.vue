<template>
  <div :id="`post${post.id}`" class="card" :class="{ 'is-deleted': isDeleted, 'is-hidden': isHidden }">
    <div class="card-content">
      <div v-if="isDeleted" class="state-notice is-deleted">
        <FontAwesomeIcon :icon="faTrashCan" />
        <span>This post was deleted and is only visible to staff.</span>
      </div>
      <div v-else-if="isHidden" class="state-notice is-hidden">
        <FontAwesomeIcon :icon="faEyeSlash" />
        <span>This post is hidden and is only visible to staff.</span>
      </div>

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
            <p class="is-size-6">
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
              v-if="pageProps && post.idx != null"
              :to="{
                name: 'posts',
                params: { ...pageProps.routeParams, topicId: pageProps.topicId, pageStr: pageProps.pageStr },
                query: { p: post.id },
                hash: `#post${post.id}`,
              }"
            >
              #{{ post.idx }}
            </router-link>
          </div>

          <ForumPostContent :content="post.content" />
          <ForumPoll v-if="poll" :poll="poll" />
          <template v-if="post.postEditCreatedAt || post.postEditCreatorId || post.postEditReason">
            <i
              >Last edited by <UserLink :user="lastEditUser ?? null"></UserLink>;
              {{ localeStore.formatDate(post.postEditCreatedAt) }}.
              <span v-if="post.postEditReason">Reason: {{ post.postEditReason }}</span>
            </i>
            <div v-if="canSeeEditHistory" class="mt-1">
              <PostEditHistory :topic-id="post.topicId" :post-id="post.id" />
            </div>
          </template>
          <template v-if="settingsStore.showSignatures && creator?.signature">
            <hr />
            <div>
              <ForumPostContent :content="creator.signature"></ForumPostContent>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@yukkuricraft-forums-archive/types/post'
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import ForumPostContent from '@/components/forum/ForumPostContent.vue'
import ForumPoll from '@/components/forum/ForumPoll.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed, onServerPrefetch } from 'vue'
import UserLink from '@/components/UserLink.vue'
import PostEditHistory from '@/components/forum/PostEditHistory.vue'
import { useLocaleStore } from '@/stores/localization.ts'
import { useSettingsStore } from '@/stores/settings.ts'
import { useActiveUser, useUser } from '@/composables/apiComposables.ts'
import type { TopicRoute } from '@/util/RouteTypes.ts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrashCan, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const localeStore = useLocaleStore()
const settingsStore = useSettingsStore()

const props = defineProps<{
  post: Post
  poll?: NonNullable<Topic['poll']>
  pageProps?: {
    routeParams: TopicRoute
    topicId: string
    pageStr?: string
  }
}>()

const { data: activeUser } = useActiveUser()
const canSeeEditHistory = computed(() => Boolean(activeUser.value?.isStaff || activeUser.value?.isAdmin))

const isDeleted = computed(() => Boolean(props.post.deletedAt))
const isHidden = computed(() => props.post.hidden && !isDeleted.value)

const { data: creator, suspense: creatorSuspense } = useUser(computed(() => props.post.creatorId))
const { data: lastEditUser, suspense: lastEditUserSuspense } = useUser(computed(() => props.post.postEditCreatorId))

onServerPrefetch(async () => {
  await creatorSuspense()
  await lastEditUserSuspense()
})
</script>
