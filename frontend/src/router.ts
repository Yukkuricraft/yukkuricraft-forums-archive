import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import HomePage from './pages/HomePage.vue'
import SectionPage from './pages/SectionPage.vue'
import ForumPage from './pages/ForumPage.vue'
import TopicPage from './pages/TopicPage.vue'
import UserPage from '@/pages/UserPage.vue'
import SearchPage from '@/pages/SearchPage.vue'

export function createYcForumsRouter() {
  return createRouter({
    history: import.meta.env.SSR ? createMemoryHistory('/') : createWebHistory('/'),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomePage,
      },
      {
        path: '/forum/:sectionSlug?',
        name: 'section',
        component: SectionPage,
        props: true,
      },
      {
        path: `/forum/:sectionSlug/:forumPath((?!page\\d+\\)[^/]+)+/:pageStr(page\\d+)?`,
        name: 'forum',
        component: ForumPage,
        props: true,
      },
      {
        path: `/forum/:sectionSlug/:forumPath((?!page\\d+\\)[^/]+)+/:topicId(\\d+)-:topic/:pageStr(page\\d+)?`,
        name: 'posts',
        component: TopicPage,
        props: true,
      },
      {
        path: '/search',
        name: 'search',
        component: SearchPage,
        props: true,
      },
      {
        path: '/members/:userId-:userName',
        name: 'user',
        component: UserPage,
        props: true,
      },
    ],
    scrollBehavior(to, from, savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (savedPosition) {
            return resolve(savedPosition)
          } else {
            return resolve({ left: 0, top: 0, behavior: 'smooth' })
          }
        }, 100)
      })
    },
  })
}
