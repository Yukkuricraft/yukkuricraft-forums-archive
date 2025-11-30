<template>
  <div class="card">
    <div class="card-content">
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

const topicStore = useTopicsStore()
const localeStore = useLocaleStore()

const props = defineProps<{ topic: Topic; routeParams: ForumRoute }>()

const { data: creator, suspense: creatorSuspense } = await useUser(computed(() => props.topic.creatorId))
const { data: lastPostUser, suspense: lastPostUserSuspense } = await useUser(
  computed(() => props.topic.lastPostSummary.userId),
)

onServerPrefetch(async () => {
  await creatorSuspense()
  await lastPostUserSuspense()
})
</script>
