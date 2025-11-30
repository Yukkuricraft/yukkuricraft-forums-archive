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
        <UserLink :user="creator ?? null" /> <span v-if="post.id === post.topic.id">started a topic </span
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
        <ForumPostContent
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
      {{ localeStore.formatDate(post.createdAt) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchPost as SearchPostType } from '@yukkuricraft-forums-archive/types/search'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed, onServerPrefetch, ref } from 'vue'
import UserLink from '@/components/UserLink.vue'
import ForumPostContent from '@/components/forum/ForumPostContent.vue'

import { pageCount } from '@/util/pathUtils.ts'
import { useLocaleStore } from '@/stores/localization.ts'
import { useUser } from '@/composables/apiComposables.ts'

const props = defineProps<{
  post: SearchPostType
}>()

const localeStore = useLocaleStore()

const hideContent = ref(true)

const { data: creator, suspense } = useUser(computed(() => props.post.creatorId))

onServerPrefetch(suspense)

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
</script>
