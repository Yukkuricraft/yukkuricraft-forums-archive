<template>
  <nav class="breadcrumb mt-2">
    <ul>
      <li
        v-for="(item, i) in breadcrumpItems"
        :key="item.key"
        class="breadcrumb-item"
        :class="{ 'is-active': i === breadcrumpItems.length - 1 }"
      >
        <router-link :to="item.to">{{ item.text }}</router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue'
import { type RouteLocationRaw, useRoute } from 'vue-router'
import { useRootForums } from '@/composables/apiComposables.ts'
import { useTopicsStore } from '@/stores/topics.ts'

const { data: rootForums, suspense } = useRootForums()

const topicStore = useTopicsStore()

const route = useRoute()

onServerPrefetch(suspense)

const breadcrumpItems = computed<{ text: string; to: RouteLocationRaw; key: string }[]>(() => {
  const strPath = route.path
  if (strPath === '/') {
    return []
  }
  const path = strPath.split('/').slice(1)

  if (/page\d+/gm.test(path[path.length - 1])) {
    path.pop()
  }

  const res: { text: string; to: RouteLocationRaw; key: string }[] = []
  res.push({
    text: 'Home',
    to: { name: 'home' },
    key: 'home',
  })

  if (path[0] === 'member' && path.length > 1) {
    path.shift()
    const userIdName = path.shift()
    if (!userIdName) return res

    const [id, name] = userIdName?.split('-')

    res.push({
      text: decodeURIComponent(name) ?? decodeURIComponent(userIdName),
      to: { name: 'user', params: { userId: id, userName: name } },
      key: `home/member/${userIdName}`,
    })
    return res
  }

  if ((path[0] === '@me' || path[0] === 'special') && path[1] === 'private-messages') {
    res.push({
      text: 'Private Messages',
      to: { name: 'private-messages' },
      key: 'home/private-messages',
    })

    const topicSlug = path[2]
    if (topicSlug && /^\d+/gm.test(topicSlug)) {
      res.push({
        text: topicStore.currentTopic?.title ?? topicSlug,
        to: {
          name: 'posts',
          params: {
            forumPath: ['special', 'private-messages'],
            topic: topicStore.currentTopic?.slug,
            topicId: topicStore.currentTopic?.id,
          },
        },
        key: `home/private-messages/${topicSlug}`,
      })
    }
    return res
  }

  const forumPath = []
  let forums = rootForums.value
  let forumSlug: string | undefined
  while ((forumSlug = path.shift())) {
    if (/^\d+/gm.test(forumSlug)) {
      res.push({
        text: topicStore.currentTopic?.title ?? forumSlug,
        to: {
          name: 'posts',
          params: {
            forumPath: [...forumPath],
            topic: topicStore.currentTopic?.slug,
            topicId: topicStore.currentTopic?.id,
          },
        },
        key: `home/${forumPath.join('/')}/${forumSlug}`,
      })
      break
    }

    forumPath.push(forumSlug)

    const forum = forums?.find((forum) => forum.slug === forumSlug)
    forums = forum?.subForums

    res.push({
      text: forum?.title ?? forumSlug,
      to: { name: 'forum', params: { forumPath: [...forumPath] } },
      key: `home/${forumPath.join('/')}`,
    })
  }

  return res
})
</script>
