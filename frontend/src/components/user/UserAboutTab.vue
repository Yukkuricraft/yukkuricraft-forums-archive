<template>
  <div class="box">
    <section>
      <h2 class="profile-bar is-size-5 has-text-weight-bold mb-3">Basic Information</h2>
      <h3 class="has-text-weight-bold mb-2">About {{ user.name }}</h3>
      <MarkdownLazy
        v-if="user.biography"
        class="content mb-3"
        :content="user.biography.replaceAll('\r\n', '\n')"
      />
      <dl v-if="aboutFields.length" class="profile-fields mb-2">
        <template v-for="field in aboutFields" :key="field.label">
          <dt class="has-text-weight-semibold">{{ field.label }}:</dt>
          <dd>{{ field.value }}</dd>
        </template>
      </dl>
      <p v-if="!user.biography && !aboutFields.length" class="has-text-grey">Nothing to show here yet.</p>
    </section>

    <section v-if="user.signature" class="mt-5">
      <h2 class="profile-bar is-size-5 has-text-weight-bold mb-3">Signature</h2>
      <ForumPostContent class="has-text-grey is-size-6" :content="user.signature" />
    </section>

    <section class="mt-5">
      <h2 class="profile-bar is-size-5 has-text-weight-bold mb-3">Statistics</h2>

      <h3 class="has-text-weight-bold mb-2">Total Posts</h3>
      <dl class="profile-fields mb-2">
        <dt class="has-text-weight-semibold">Total Posts:</dt>
        <dd>{{ localeStore.formatNumber(user.postCount) }}</dd>
      </dl>

      <h3 class="has-text-weight-bold mt-4 mb-2">Visitor Messages</h3>
      <dl class="profile-fields mb-2">
        <dt class="has-text-weight-semibold">Total Messages:</dt>
        <dd>{{ localeStore.formatNumber(postsCount?.posts ?? 0) }}</dd>
      </dl>
      <a @click="emit('navigate-to-visitor-messages')">Visitor Messages for {{ user.name }}</a>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue'
import type { User } from '@yukkuricraft-forums-archive/types/user'
import MarkdownLazy from '@/components/markdown/MarkdownLazy.vue'
import ForumPostContent from '@/components/forum/ForumPostContent.vue'
import { useVisitorMessagesCount } from '@/composables/apiComposables.ts'
import { useLocaleStore } from '@/stores/localization.ts'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  'navigate-to-visitor-messages': []
}>()

const localeStore = useLocaleStore()

const { data: postsCount, suspense } = useVisitorMessagesCount(computed(() => props.user.id))
onServerPrefetch(suspense)

const aboutFields = computed(() =>
  [
    { label: 'Location', value: props.user.location && decodeHtmlEntities(props.user.location) },
    { label: 'Interests', value: props.user.interests && decodeHtmlEntities(props.user.interests) },
    { label: 'In-Game Name', value: props.user.inGameName && decodeHtmlEntities(props.user.inGameName) },
    { label: 'Occupation', value: props.user.occupation && decodeHtmlEntities(props.user.occupation) },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value)),
)
</script>

<style scoped>
.profile-bar {
  padding: 0.4rem 0.75rem;
  background-color: var(--bulma-background);
  border-radius: var(--bulma-radius-small);
}

.profile-fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.15rem 0.75rem;
}

.profile-fields dd {
  margin: 0;
}

a:not([href]) {
  cursor: pointer;
}
</style>
