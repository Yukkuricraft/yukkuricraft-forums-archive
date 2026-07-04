import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/pages/HomePage.vue'
import TopicPage from '@/pages/TopicPage.vue'
import UserPage from '@/pages/UserPage.vue'
import SearchPage from '@/pages/SearchPage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import type { ForumRoute, TopicRoute } from '@/util/RouteTypes.ts'
import ForumOrSectionPage from '@/pages/ForumOrSectionPage.vue'
import { Api, NotFoundError, useApi } from '@/util/Api.ts'
import type { User } from '@yukkuricraft-forums-archive/types/user'
import PrivateMessagesPage from '@/pages/PrivateMessagesPage.vue'

function first(str: string | string[]): string {
  return Array.isArray(str) ? str[0] : str
}

function arr(str: string | string[]): string[] {
  return Array.isArray(str) ? str : [str]
}

export function createYcForumsRouter(api: Api) {
  return createRouter({
    history: import.meta.env.SSR ? createMemoryHistory('/') : createWebHistory('/'),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomePage,
      },
      {
        path: '/about',
        name: 'about',
        component: AboutPage,
      },
      {
        path: '/search',
        name: 'search',
        component: SearchPage,
        props: true,
      },
      {
        path: '/member/:userId-:userName',
        name: 'user',
        component: UserPage,
        props: true,
      },
      {
        path: '/@me/private-messages/:pageStr(page\\d+)?',
        name: 'private-messages',
        component: PrivateMessagesPage,
        props: true,
      },
      {
        path: `/:forumPath((?!page\\d+\\)(?!member\\)[^/]+)+/:pageStr(page\\d+)?`,
        name: 'forum',
        component: ForumOrSectionPage,
        props: (route) => ({
          routeParams: {
            forumPath: arr(route.params.forumPath),
          } satisfies ForumRoute,
          pageStr: route.params.pageStr,
        }),
      },
      {
        path: `/:forumPath((?!page\\d+\\)(?!member\\)[^/]+)+/:topicId(\\d+)-:topic?/:pageStr(page\\d+)?`,
        name: 'posts',
        component: TopicPage,
        props: (route) => ({
          routeParams: {
            forumPath: arr(route.params.forumPath),
            topic: first(route.params.topic),
          } satisfies TopicRoute,
          topicId: route.params.topicId,
          pageStr: route.params.pageStr,
        }),
      },
    ],
    scrollBehavior(to, from, savedPosition) {
      return new Promise((resolve) => {
        if (savedPosition) {
          return setTimeout(() => resolve(savedPosition), 100)
        }

        if (to.hash) {
          // The target post can load asynchronously (e.g. after a ?p= page redirect),
          // so poll for the element before scrolling. Offset for the fixed navbar so
          // the linked post isn't hidden behind it.
          let attempts = 0
          const scrollToHash = () => {
            if (typeof document !== 'undefined' && document.querySelector(to.hash)) {
              resolve({ el: to.hash, top: 52, behavior: 'smooth' })
            } else if (attempts++ < 20) {
              setTimeout(scrollToHash, 100)
            } else {
              resolve({ el: to.hash, top: 52 })
            }
          }
          return scrollToHash()
        }

        setTimeout(() => resolve({ left: 0, top: 0, behavior: 'smooth' }), 100)
      })
    },
  })
}
