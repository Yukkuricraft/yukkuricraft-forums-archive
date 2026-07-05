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
            <router-link :to="topicRoute" @click="onSelect">
              <h2 class="h4">
                <FontAwesomeIcon
                  v-if="isRedirect"
                  :icon="faShareFromSquare"
                  class="redirect-icon"
                  title="This topic redirects to another topic"
                />
                <FontAwesomeIcon
                  v-if="hasPoll"
                  :icon="faSquarePollVertical"
                  class="poll-icon"
                  title="This topic has a poll"
                />
                {{ topic.title === '' ? 'Title' : decodeHtmlEntities(topic.title) }}
              </h2>
            </router-link>
            <div class="byline">
              <p>
                Started by
                <UserLink :user="creator ?? null" />, {{ localeStore.formatDate(topic.createdAt) }}
              </p>
              <p v-if="topic.recipients.length">
                To:
                <template v-for="(recipient, i) in topic.recipients" :key="recipient.id">
                  <router-link :to="{ name: 'user', params: { userId: recipient.id, userName: recipient.name } }">
                    {{ recipient.name }} </router-link
                  ><span v-if="i < topic.recipients.length - 1">, </span>
                </template>
              </p>
            </div>
          </div>

          <TopicTags :tags="topic.tags" />

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
import { faTrashCan, faEyeSlash, faSquarePollVertical, faShareFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onServerPrefetch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { Topic } from '#shared/types/topic'
import TopicTags from '@/components/topic/TopicTags.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserLink from '@/components/UserLink.vue'
import { useUser } from '@/composables/apiComposables.js'
import { useLocaleStore } from '@/stores/localization.js'
import { useTopicsStore } from '@/stores/topics.js'
import { decodeHtmlEntities } from '@/util/htmlEntities.js'
import type { ForumRoute } from '@/util/RouteTypes.js'

const topicStore = useTopicsStore()
const localeStore = useLocaleStore()

const props = defineProps<{ topic: Topic; routeParams: ForumRoute }>()

const isDeleted = computed(() => Boolean(props.topic.deletedAt))
const isHidden = computed(() => props.topic.hidden && !isDeleted.value)
const hasPoll = computed(() => Boolean(props.topic.poll))
const isRedirect = computed(() => Boolean(props.topic.redirectTo))

const topicRoute = computed<RouteLocationRaw>(() => {
  const redirectTo = props.topic.redirectTo
  if (redirectTo) {
    return {
      name: 'posts',
      params: { forumPath: redirectTo.forumSlug, topic: redirectTo.slug, topicId: redirectTo.id },
    }
  }

  return {
    name: 'posts',
    params: { ...props.routeParams, topic: props.topic.slug, topicId: props.topic.id },
  }
})

function onSelect() {
  // Add to the topic store only for real topics. The redirect target is fetched fresh on the target page.
  if (!isRedirect.value) {
    topicStore.selectTopic(props.topic)
  }
}

const { data: creator, suspense: creatorSuspense } = useUser(computed(() => props.topic.creatorId))
const { data: lastPostUser, suspense: lastPostUserSuspense } = useUser(
  computed(() => props.topic.lastPostSummary.userId),
)

onServerPrefetch(async () => {
  await creatorSuspense()
  await lastPostUserSuspense()
})
</script>

<style scoped lang="scss">
.poll-icon,
.redirect-icon {
  margin-right: 0.4em;
  color: var(--bulma-link);
  font-size: 0.85em;
  vertical-align: baseline;
}
</style>
