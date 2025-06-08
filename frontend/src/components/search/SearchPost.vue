<template>
  <div class="media">
    <div class="media-left">
      <UserAvatar
        :width="64"
        :user-id="post.creatorId"
        :user-name="creator?.name"
        :has-avatar="Boolean(creator?.avatarId)"
        :thumbnail="true"
      />
    </div>
    <div class="media-content" style="width: 80%">
      <p>
        <UserLink :user="creator" /> <span v-if="post.id === post.topic.id">started a topic </span
        ><span v-else>replied to </span>
        <strong>
          <router-link
            v-if="(post.topic.forum.slug ?? [])[0] === 'forum'"
            :to="{
              name: 'posts',
              params: {
                sectionSlug: sectionSlug,
                forumPath,
                topicId: post.topic.id,
                topic: post.topic.slug,
                pageStr: postPage,
              },
            }"
            >{{ post.topic.title }}</router-link
          >
          <span v-else>{{ post.topic.title }}</span>
        </strong>
        in {{ post.topic.forum.title }}
        <br />
        <PostContent
          :style="hideContent ? { overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '10rem' } : {}"
          :content="post.content"
        />
        <br />
        <button type="button" class="button" @click="hideContent = !hideContent">
          <span v-if="hideContent">Show more</span>
          <span v-else>Show less</span>
        </button>
      </p>
    </div>

    <div class="media-right">
      {{ formatDateStr(post.createdAt as unknown as string) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchPost as SearchPostType } from '@yukkuricraft-forums-archive/backend/dist/routes/search.ts'
import UserAvatar from '@/components/UserAvatar.vue'
import { useUsers } from '@/dataComposables.ts'
import { computed, ref } from 'vue'
import UserLink from '@/components/UserLink.vue'
import { pageCount } from '@/util/pageCount.ts'
import PostContent from '@/components/PostContent.vue'

const props = defineProps<{
  post: SearchPostType
}>()

const hideContent = ref(true)

const users = useUsers(computed(() => (props.post.creatorId === null ? [] : [props.post.creatorId])))
const creator = computed(() => {
  if (!props.post.creatorId) return null
  return users.value[props.post.creatorId]?.state.value ?? null
})

const sectionSlug = computed(() => {
  const slug = props.post.topic.forum.slug ?? []
  if (slug.length < 2) return ''
  return slug[1]
})

const forumPath = computed(() => {
  const slug = props.post.topic.forum.slug ?? []
  return slug.slice(2)
})

const postPage = computed(() => {
  if (props.post.idx === null) return undefined
  return 'page' + pageCount(props.post.idx, 10)
})

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
</script>
