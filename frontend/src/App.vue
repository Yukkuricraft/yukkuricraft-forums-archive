<template>
  <div class="site">
    <Navbar />

    <div class="site-content">
      <div id="contentRoot" class="container" :class="route.meta.isError ? 'container-error' : ''">
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
        <router-view />
      </div>
    </div>

    <Footer class="mt-5" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteLocationRaw, useRoute } from 'vue-router'
import Navbar from './components/ForumsNavbar.vue'
import Footer from './components/YcFooter.vue'
import { useForumForums } from './dataComposables'

const { state: sections } = useForumForums()

const route = useRoute()

const breadcrumpItems = computed<{ text: string; to: RouteLocationRaw; key: string }[]>(() => {
  const strPath = route.path
  if (strPath === '/') {
    return []
  }
  const path = strPath.split('/').slice(2)

  if (/page\d+/gm.test(path[path.length - 1])) {
    path.pop()
  }

  const res: { text: string; to: RouteLocationRaw; key: string }[] = []
  res.push({
    text: 'Home',
    to: { name: 'home' },
    key: 'home',
  })

  const sectionSlug = path.shift()
  if (!sectionSlug) {
    return []
  }

  const section = sections.value?.find((section) => section.slug === sectionSlug)
  res.push({
    text: section?.title ?? sectionSlug,
    to: { name: 'section', params: { sectionSlug } },
    key: `home/${sectionSlug}`
  })

  const forumPath = []
  let forums = section?.subForums
  let forumSlug: string | undefined
  while ((forumSlug = path.shift())) {
    if (/^\d+/gm.test(forumSlug)) {
      res.push({
        text: forumSlug, // TODO current topic name
        to: { name: 'posts', params: { sectionSlug, forumPath, topic: forumSlug } },
        key: `home/${sectionSlug}/${forumPath.join('/')}/${forumSlug}`
      })

      /*
      res.push({
        text: this.getCurrentTopic?.title ?? forumSlug,
        to: { name: 'posts', params: { forumPath: [...forumPath] } },
      })
      */
      break
    }

    forumPath.push(forumSlug)

    const forum = forums?.find((forum) => forum.slug === forumSlug)
    forums = forum?.subForums

    res.push({
      text: forum?.title ?? forumSlug,
      to: { name: 'forum', params: { sectionSlug, forumPath } },
      key: `home/${sectionSlug}/${forumPath.join('/')}`
    })
  }

  return res
})
</script>
