<template>
  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">Keywords</label>
    </div>
    <div class="field-body">
      <div class="field">
        <div class="control">
          <input
            class="input"
            type="text"
            :value="searchJson.keywords"
            @input="(e) => emit('update:searchJson', { ...searchJson, keywords: (e.target as HTMLInputElement).value })"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">Members</label>
    </div>
    <div class="field-body">
      <div class="mr-2">
        <span v-for="author in searchJson.author"
          >{{ author }} <FontAwesomeIcon :icon="faTimesCircle" size="xs" @click="removeAuthor(author)"
        /></span>
      </div>
      <div class="field">
        <div class="control">
          <input class="input" type="text" v-model="authorField" @keyup.enter="addAuthor()" />
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <span class="label">Date Range</span>
    </div>

    <div class="field-body">
      <div class="field">
        <label class="label">From</label>
        <div class="control">
          <input
            class="input"
            type="date"
            :value="searchJson.date?.from ?? null"
            @input="
              (e) =>
                emit('update:searchJson', {
                  ...searchJson,
                  date: { from: (e.target as HTMLInputElement).valueAsDate, to: searchJson.date!.to },
                })
            "
          />
        </div>
      </div>

      <div class="field">
        <label class="label">To</label>
        <div class="control">
          <input
            class="input"
            type="date"
            :value="searchJson.date?.from ?? null"
            @input="
              (e) =>
                emit('update:searchJson', {
                  ...searchJson,
                  date: { from: searchJson.date!.from, to: (e.target as HTMLInputElement).valueAsDate },
                })
            "
          />
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">Sorting</label>
    </div>
    <div class="field-body">
      <div class="field">
        <div class="control">
          <div class="select">
            <select v-model="sortSelected">
              <option value="relevance">Relevance</option>
              <option value="title">Title</option>
              <option value="author">Members</option>
              <option value="created">Date - started post</option>
              <option value="lastcontent">Date - last update</option>
              <option value="replies">Replies</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">Order</label>
    </div>
    <div class="field-body">
      <div class="field">
        <div class="control">
          <div class="select">
            <select v-model="orderSelected">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">Sources</label>
    </div>
    <div class="field-body">
      <div class="field">
        <div class="control">
          <div class="select is-multiple">
            <select
              @input="
                (e) =>
                  emit('update:searchJson', {
                    ...searchJson,
                    channel: [...(e.target as HTMLSelectElement).selectedOptions].map((o) => o.value),
                  })
              "
              multiple
              size="6"
            >
              <option
                v-for="option in channelOptions"
                :value="option.value"
                :style="{ marginLeft: `${1.5 * option.depth}rem` }"
                :selected="searchJson.channel?.includes(option.value.toString())"
              >
                {{ option.option }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="field is-horizontal">
    <div class="field-label">
      <label class="label">View</label>
    </div>
    <div class="field-body">
      <div class="field">
        <div class="control">
          <div class="select">
            <select
              :value="props.searchJson.view ?? 'default'"
              @input="
                (e) =>
                  emit('update:searchJson', {
                    ...searchJson,
                    view: (e.target as HTMLSelectElement).value as 'default' | 'topic',
                  })
              "
            >
              <option value="default">Posts</option>
              <option value="topic">Topics</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SearchJsonObj } from '@/pages/SearchPage.vue'
import type { ForumTree } from '@yukkuricraft-forums-archive/types/forum'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { useForumsStore } from '@/stores/forums.ts'

const forumStore = useForumsStore()

const props = defineProps<{ q: string; searchJson: SearchJsonObj }>()

const emit = defineEmits<{
  (e: 'update:searchJson', searchJson: SearchJsonObj): void
}>()

watch(
  computed(() => props.searchJson),
  () => {
    if (props.searchJson.keywords === undefined) {
      emit('update:searchJson', {
        ...props.searchJson,
        keywords: '',
      })
    }

    if (props.searchJson.author === undefined) {
      emit('update:searchJson', {
        ...props.searchJson,
        author: [],
      })
    }

    if (props.searchJson.date === undefined) {
      emit('update:searchJson', {
        ...props.searchJson,
        date: {
          from: null,
          to: null,
        },
      })
    }

    if (props.searchJson.channel === undefined) {
      emit('update:searchJson', { ...props.searchJson, channel: [] })
    }
  },
  { immediate: true },
)

const authorField = ref('')

function addAuthor() {
  emit('update:searchJson', { ...props.searchJson, author: [...(props.searchJson.author ?? []), authorField.value] })
  authorField.value = ''
}

function removeAuthor(author: string) {
  emit('update:searchJson', { ...props.searchJson, author: props.searchJson.author?.filter((a) => a != author) })
}

const sortOrderSelected = computed<[keyof Required<SearchJsonObj>['sort'], 'asc' | 'desc']>(() => {
  const obj = props.searchJson.sort ?? {}
  for (const objKey in obj) {
    const k = objKey as keyof typeof obj
    if (obj[k] !== undefined) {
      return [k, obj[k]]
    }
  }

  return ['relevance', 'desc'] as const
})
const sortSelected = computed({
  get: () => sortOrderSelected.value[0],
  set: (v) => {
    emit('update:searchJson', {
      ...props.searchJson,
      sort: {
        [v]: sortOrderSelected.value[1],
      },
    })
  },
})
const orderSelected = computed({
  get: () => sortOrderSelected.value[1],
  set: (v) => {
    emit('update:searchJson', {
      ...props.searchJson,
      sort: {
        [sortSelected.value]: v,
      },
    })
  },
})

const channelOptions = computed(() => {
  const options: { option: string; value: number; depth: number }[] = []

  function addForumOption(f: ForumTree, depth: number) {
    // Special
    if (f.id === 6) {
      return
    }

    options.push({ option: f.title, value: f.id, depth })
    f.subForums.forEach((sf) => addForumOption(sf, depth + 1))
  }

  forumStore.rootForums.forEach((f) => addForumOption(f, 0))

  return options
})
</script>
