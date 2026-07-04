<template>
  <div class="card" :class="{ 'is-deleted': isDeleted, 'is-hidden': isHidden }">
    <div class="card-content">
      <div v-if="isDeleted" class="state-notice is-compact is-deleted">
        <FontAwesomeIcon :icon="faTrashCan" />
        <span>This topic was deleted and is only visible to staff.</span>
      </div>
      <div v-else-if="isHidden" class="state-notice is-compact is-hidden">
        <FontAwesomeIcon :icon="faEyeSlash" />
        <span>This topic is hidden and is only visible to staff.</span>
      </div>

      <div class="media">
        <div class="media-left">
          <UserAvatar
            :width="64"
            :user-id="topic.creatorId"
            :user-name="creator?.name"
            :has-avatar="Boolean(creator?.avatarId)"
            :thumbnail="true"
          />
        </div>

        <div class="media-content">
          <div>
            <router-link
              :to="{
                name: 'posts',
                params: { ...routeParams, topic: topic.slug, topicId: topic.id },
              }"
              @click="topicStore.selectTopic(topic)"
            >
              <h2 class="h4">{{ topic.title === '' ? 'Title' : decodeHtmlEntities(topic.title) }}</h2>
            </router-link>
            <div class="byline">
              <p>
                Started by
                <UserLink :user="creator ?? null" />, {{ localeStore.formatDate(topic.createdAt) }}
              </p>
            </div>
          </div>

          <small>Responses: {{ localeStore.formatNumber(topic.postCount - 1) }}</small>
        </div>

        <div class="media-right">
          Last post:
          <div class="media">
            <div class="media-left">
              <UserAvatar
                :width="32"
                :user-id="lastPostUser?.id"
                :user-name="lastPostUser?.name"
                :has-avatar="Boolean(lastPostUser?.avatarId)"
                :thumbnail="true"
              />
            </div>

            <div class="media-content">
              <div>
                <div class="byline">
                  <p>Posted: {{ localeStore.formatDate(topic.lastPostSummary.at) }}</p>
                  <p>By: <UserLink :user="lastPostUser ?? null" /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed, onServerPrefetch } from 'vue'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'
import { useTopicsStore } from '@/stores/topics.ts'
import { useLocaleStore } from '@/stores/localization.ts'
import { useUser } from '@/composables/apiComposables.ts'
import type { ForumRoute } from '@/util/RouteTypes.ts'
import UserLink from '@/components/UserLink.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrashCan, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const topicStore = useTopicsStore()
const localeStore = useLocaleStore()

const props = defineProps<{ topic: Topic; routeParams: ForumRoute }>()

const isDeleted = computed(() => Boolean(props.topic.deletedAt))
const isHidden = computed(() => props.topic.hidden && !isDeleted.value)

const { data: creator, suspense: creatorSuspense } = await useUser(computed(() => props.topic.creatorId))
const { data: lastPostUser, suspense: lastPostUserSuspense } = await useUser(
  computed(() => props.topic.lastPostSummary.userId),
)

onServerPrefetch(async () => {
  await creatorSuspense()
  await lastPostUserSuspense()
})
</script>
