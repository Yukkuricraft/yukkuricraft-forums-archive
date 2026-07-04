<template>
  <div class="visitor-message">
    <div class="visitor-message-author">
      <UserAvatar
        :width="96"
        :user-id="post.creatorId"
        :user-name="creator?.name"
        :has-avatar="Boolean(creator?.avatarId)"
        :thumbnail="true"
      />
    </div>
    <div class="visitor-message-body" :class="{ 'is-deleted': isDeleted, 'is-hidden': isHidden }">
      <div class="visitor-message-header">
        <span>
          <strong><UserLink :user="creator ?? null" /></strong>
          <span class="visitor-message-date"> &ndash; {{ localeStore.formatDate(post.createdAt) }}</span>
        </span>
      </div>
      <div class="visitor-message-content">
        <div v-if="isDeleted" class="state-notice is-compact is-deleted">
          <FontAwesomeIcon :icon="faTrashCan" />
          <span>This message was deleted and is only visible to staff.</span>
        </div>
        <div v-else-if="isHidden" class="state-notice is-compact is-hidden">
          <FontAwesomeIcon :icon="faEyeSlash" />
          <span>This message is hidden and is only visible to staff.</span>
        </div>
        <ForumPostContent :content="post.content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@yukkuricraft-forums-archive/types/post'
import { computed, onServerPrefetch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrashCan, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import UserLink from '@/components/UserLink.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import ForumPostContent from '@/components/forum/ForumPostContent.vue'
import { useUser } from '@/composables/apiComposables.ts'
import { useLocaleStore } from '@/stores/localization.ts'

const props = defineProps<{
  post: Post
}>()

const localeStore = useLocaleStore()

const { data: creator, suspense } = useUser(computed(() => props.post.creatorId))
onServerPrefetch(suspense)

const isDeleted = computed(() => Boolean(props.post.deletedAt))
const isHidden = computed(() => props.post.hidden && !isDeleted.value)
</script>

<style scoped>
.visitor-message {
  display: grid;
  grid-template-columns: minmax(7rem, 9rem) 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.visitor-message-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
  word-break: break-word;
}

.visitor-message-body {
  border: 1px solid var(--bulma-border-weak);
  border-radius: var(--bulma-radius);
  overflow: hidden;
}

.visitor-message-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.4rem 0.75rem;
  background-color: var(--bulma-background);
  border-bottom: 1px solid var(--bulma-border-weak);
}

.visitor-message-date {
  color: var(--bulma-text-weak);
}

.visitor-message-content {
  padding: 0.75rem;
}

.visitor-message-body.is-deleted {
  border-left: 4px solid var(--bulma-danger);
}

.visitor-message-body.is-hidden {
  border-left: 4px solid var(--bulma-warning);
}
</style>
