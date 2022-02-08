import VueRouter from 'vue-router'

import HomePage from './pages/HomePage'
import SectionPage from './pages/SectionPage'
import ForumPage from './pages/ForumPage'
import PostsPage from './pages/PostsPage'

export function createRouter() {
  return new VueRouter({
    base: '/',
    mode: 'history',
    routes: [
      {
        path: '/',
				alias: '/forum',
        name: 'home',
        component: HomePage,
        pathToRegexpOptions: { strict: true },
      },
			{
				path: '/forum/:sectionSlug',
				name: 'section',
				component: SectionPage,
        props: true,
				pathToRegexpOptions: { strict: true },
			},
      {
        path: `/forum/:forumPathP([A-Za-z][\\w\\-]*|\\d+[page]+)+`, //Hacky way around breaking groups
        name: 'forum',
        component: ForumPage,
        props: true,
        pathToRegexpOptions: { strict: true },
      },
      {
        path: `/forum/:forumPathP+`,
        name: 'posts',
        component: PostsPage,
        props: true,
        pathToRegexpOptions: { strict: true },
      },
    ],
  })
}
