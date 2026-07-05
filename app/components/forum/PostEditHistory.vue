<template>
  <span>
    <button type="button" class="button is-ghost is-small px-0" @click="open = true">
      <span class="icon is-small">
        <FontAwesomeIcon :icon="faClockRotateLeft" />
      </span>
      <span>View edit history</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="modal is-active">
        <div class="modal-background" @click="open = false"></div>
        <div class="modal-card edit-history-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Edit history</p>
            <button type="button" class="delete" aria-label="close" @click="open = false"></button>
          </header>
          <section class="modal-card-body">
            <LoadingSpinner v-if="isLoading" label="Loading edit history…" size="lg" />
            <p v-else-if="isError" class="has-text-danger">Failed to load edit history.</p>
            <p v-else-if="versions.length === 0" class="has-text-grey">No edit history is available for this post.</p>

            <template v-else>
              <div class="field is-grouped is-align-items-flex-end mb-4 is-flex-wrap-wrap">
                <div class="control">
                  <label class="label is-small">Compare from</label>
                  <div class="select is-small">
                    <select v-model.number="fromIndex">
                      <option v-for="opt in versionOptions" :key="opt.index" :value="opt.index">{{ opt.label }}</option>
                    </select>
                  </div>
                </div>
                <div class="control">
                  <label class="label is-small">to</label>
                  <div class="select is-small">
                    <select v-model.number="toIndex">
                      <option v-for="opt in versionOptions" :key="opt.index" :value="opt.index">{{ opt.label }}</option>
                    </select>
                  </div>
                </div>
                <div class="control">
                  <div class="buttons has-addons mb-0">
                    <button
                      type="button"
                      class="button is-small"
                      :class="{ 'is-link is-selected': mode === 'diff' }"
                      @click="mode = 'diff'"
                    >
                      Diff
                    </button>
                    <button
                      type="button"
                      class="button is-small"
                      :class="{ 'is-link is-selected': mode === 'full' }"
                      @click="mode = 'full'"
                    >
                      Full text
                    </button>
                  </div>
                </div>
              </div>

              <p v-if="toVersion" class="is-size-7 has-text-grey mb-2">
                <template v-if="toVersion.original">Original post</template>
                <template v-else> Edited by <UserLink :user="authorFor(toVersion)" /> </template>
                on {{ localeStore.formatDate(toVersion.createdAt) }}.
                <span v-if="toVersion.reason">Reason: {{ toVersion.reason }}</span>
              </p>

              <pre v-if="mode === 'full'" class="edit-history-text">{{ toVersion?.text }}</pre>
              <pre v-else class="edit-history-text edit-history-diff"><span
                v-for="(part, i) in diff"
                :key="i"
                :class="{ 'diff-add': part.added, 'diff-remove': part.removed }"
              >{{ part.value }}</span></pre>
            </template>
          </section>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { diffWordsWithSpace } from 'diff'
import { computed, ref, watchEffect } from 'vue'

import type { PostEdit } from '#shared/types/post'
import type { User } from '#shared/types/user'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import UserLink from '@/components/UserLink.vue'
import { usePostEditHistory, useUsers } from '@/composables/apiComposables.js'
import { useLocaleStore } from '@/stores/localization.js'

const props = defineProps<{
  topicId: number
  postId: number
}>()

const open = ref(false)
const localeStore = useLocaleStore()

const { data, isLoading, isError } = usePostEditHistory(
  computed(() => props.topicId),
  computed(() => props.postId),
  () => open.value,
)

const versions = computed<PostEdit[]>(() => data.value ?? [])

const versionOptions = computed(() =>
  versions.value.map((v, index) => ({
    index,
    label: v.original ? 'Original post' : `Revision ${index} · ${localeStore.formatDate(v.createdAt)}`,
  })),
)

const mode = ref<'diff' | 'full'>('diff')
const fromIndex = ref(0)
const toIndex = ref(0)

watchEffect(() => {
  if (versions.value.length === 0) {
    return
  }
  toIndex.value = versions.value.length - 1
  fromIndex.value = Math.max(0, versions.value.length - 2)
})

const fromVersion = computed<PostEdit | undefined>(() => versions.value[fromIndex.value])
const toVersion = computed<PostEdit | undefined>(() => versions.value[toIndex.value])

const authorIds = computed(() => [
  ...new Set(versions.value.map((v) => v.creatorId).filter((id): id is number => id != null)),
])
const { data: authors } = useUsers(authorIds)
const authorMap = computed(() => {
  const map = new Map<number, User>()
  const ids = authorIds.value
  ;(authors.value ?? []).forEach((user, idx) => {
    if (user && !(user instanceof Error)) {
      map.set(ids[idx], user)
    }
  })
  return map
})

function authorFor(version: PostEdit): User | null {
  return version.creatorId != null ? (authorMap.value.get(version.creatorId) ?? null) : null
}

const diff = computed(() => diffWordsWithSpace(fromVersion.value?.text ?? '', toVersion.value?.text ?? ''))
</script>

<style scoped>
.edit-history-card {
  width: 960px;
  max-width: calc(100vw - 2rem);
}

.edit-history-text {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow: auto;
}

.diff-add {
  background: color-mix(in srgb, var(--bulma-success) 22%, transparent);
}

.diff-remove {
  background: color-mix(in srgb, var(--bulma-danger) 22%, transparent);
  text-decoration: line-through;
}
</style>
