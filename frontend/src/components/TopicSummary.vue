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
                params: { sectionSlug, forumPath: forumPath, topic: topic.slug, topicId: topic.id },
              }"
            >
              <h2 class="h4">{{ topic.title }}</h2>
            </router-link>
            <div class="byline">
              <p>Created: {{ formatDateStr(topic.createdAt as unknown as string) }} by {{ creator?.name }}</p>
            </div>
          </div>

          <small>Responses: {{ formatNumber(topic.postCount - 1) }}</small>
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
                  <p>Posted: {{ formatDateStr(topic.lastPostSummary.at as unknown as string) }}</p>
                  <p>By: {{ lastPostUser?.name }}</p>
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
import type { Topic } from '@yukkuricraft-forums-archive/backend/dist/routes/topic'
import UserAvatar from '@/components/UserAvatar.vue'
import { useUsers } from '@/dataComposables.ts'
import { computed } from 'vue'

const props = defineProps<{ topic: Topic; sectionSlug: string; forumPath: string[] }>()

const numberFormat = new Intl.NumberFormat()
function formatNumber(num: number) {
  return numberFormat.format(num)
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

function removeUndefinedNullFromArr<A>(arr: (A | null | undefined)[]): A[] {
  return arr.flatMap((a) => (a === null || a === undefined ? [] : [a]))
}

const users = useUsers(
  computed(() => removeUndefinedNullFromArr([props.topic.creatorId, props.topic.lastPostSummary.userId])),
)
const creator = computed(() => {
  if (!props.topic.creatorId) return null
  return users.value[props.topic.creatorId]?.state.value ?? null
})

const lastPostUser = computed(() => {
  if (!props.topic.lastPostSummary.userId) return null
  return users.value[props.topic.lastPostSummary.userId]?.state.value ?? null
})
</script>
