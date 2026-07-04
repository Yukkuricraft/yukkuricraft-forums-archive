<template>
  <div class="box mt-5">
    <div class="is-flex is-justify-content-flex-end mb-4">
      <span class="tag is-info is-large">
        <strong class="mr-1">{{ poll.totalVoters }}</strong>
        Voters
      </span>
    </div>

    <div v-for="(option, i) in poll.options" :key="option.id" class="poll-option">
      <p class="has-text-weight-semibold mb-1">{{ decodeHtmlEntities(option.title) }}</p>
      <div class="is-flex is-align-items-center poll-option-row">
        <div class="poll-bar">
          <div class="poll-bar-fill" :style="{ width: `${percent(option.voteCount)}%`, background: color(i) }"></div>
          <span class="poll-bar-percent has-text-weight-bold">{{ percent(option.voteCount).toFixed(2) }}%</span>
        </div>
        <span class="has-text-weight-bold has-text-right poll-option-votes">
          {{ option.voteCount }} {{ option.voteCount === 1 ? 'vote' : 'votes' }}
        </span>
      </div>

      <div v-if="canSeeVoters && option.voters" class="mt-2">
        <button
          type="button"
          class="button is-ghost is-small px-0"
          :aria-expanded="expanded.has(option.id)"
          @click="toggle(option.id)"
        >
          <span class="icon is-small">
            <FontAwesomeIcon :icon="expanded.has(option.id) ? faCaretDown : faCaretRight" />
          </span>
          <span>{{ expanded.has(option.id) ? 'Hide' : 'Show' }} voters</span>
        </button>
        <ul v-if="expanded.has(option.id)" class="poll-voters-list mt-2">
          <li v-if="!option.voters.length" class="has-text-grey">No voters</li>
          <li v-for="voter in option.voters" :key="voter.id">
            <router-link :to="{ name: 'user', params: { userId: voter.id, userName: voter.name } }">
              {{ voter.name }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '@yukkuricraft-forums-archive/types/topic'
import { computed, ref } from 'vue'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'
import { useActiveUser } from '@/composables/apiComposables.ts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons'

const props = defineProps<{ poll: NonNullable<Topic['poll']> }>()

const { data: activeUser } = useActiveUser()
const canSeeVoters = computed(() => Boolean(activeUser.value?.isStaff || activeUser.value?.isAdmin))

const palette = [
  'var(--bulma-success)',
  'var(--bulma-warning)',
  'var(--bulma-info)',
  'var(--bulma-primary)',
  'var(--bulma-link)',
  'var(--bulma-danger)',
]
function color(index: number) {
  return palette[index % palette.length]
}

function percent(voteCount: number) {
  return props.poll.totalVotes ? (voteCount / props.poll.totalVotes) * 100 : 0
}

const expanded = ref(new Set<number>())
function toggle(optionId: number) {
  const next = new Set(expanded.value)
  if (next.has(optionId)) {
    next.delete(optionId)
  } else {
    next.add(optionId)
  }
  expanded.value = next
}
</script>

<style scoped>
.poll-option:not(:last-child) {
  margin-bottom: 1rem;
}

.poll-option-row {
  gap: 1rem;
}

.poll-bar {
  position: relative;
  flex: 1;
  height: 1.75rem;
  border: 1px solid var(--bulma-border-weak);
  border-radius: var(--bulma-radius-small);
  background: var(--bulma-scheme-main-bis);
  overflow: hidden;
}

.poll-bar-fill {
  height: 100%;
  min-width: 2px;
  border-radius: inherit;
}

.poll-bar-percent {
  position: absolute;
  top: 0;
  right: 0.5rem;
  height: 100%;
  display: flex;
  align-items: center;
}

.poll-option-votes {
  white-space: nowrap;
  min-width: 4.5rem;
}

.poll-voters-list {
  margin-left: 1.2rem;
  columns: 3;
}

@media screen and (max-width: 768px) {
  .poll-voters-list {
    columns: 2;
  }
}
</style>
