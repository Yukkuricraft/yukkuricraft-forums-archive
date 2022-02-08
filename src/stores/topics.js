import isEqual from 'lodash/isEqual'

import waiterLoader from './waiterLoader'

const ycTopics = [
  {
    title: 'RTY 3 Beta',
    slug: '3540-rty-3-beta',
    poster: 'Katrix',
    date: '05-05-2017, 01:34 AM',
    responses: 104,
  },
  {
    title: 'One year...',
    slug: '3453-one-year',
    poster: 'Katrix',
    date: '12-30-2016, 05:13 AM',
    responses: 0,
  },
  {
    title: 'About RTY for 1.8.9 (or 1.9)',
    slug: '3168-about-rty-for-1-8-9-or-1-9',
    poster: 'Katrix',
    date: '11-20-2016, 02:12 AM',
    responses: 11,
  },
  {
    title: 'Calling (for help from) all texture artists',
    slug: '3437-calling-for-help-from-all-texture-artists',
    poster: 'Katrix',
    date: '11-20-2016, 02:12 AM',
    responses: 3,
  },
  {
    title: 'RTY Nostalgia',
    slug: '3117-rty-nostalgia',
    poster: 'Katrix',
    date: '02-15-2016, 09:32 PM',
    responses: 7,
  },
  {
    title: 'RTY Groups and Planning Thread',
    slug: '2536-rty-groups-and-planning-thread',
    poster: 'Cucoo5',
    date: '02-23-2015, 06:23 AM',
    responses: 34,
  },
  {
    title: 'Have a problem? Check here first!',
    slug: '2092-have-a-problem-check-here-first',
    poster: 'Katrix',
    date: '08-18-2014, 05:39 PM',
    responses: 11,
  },
]

export default {
  namespaced: true,
  modules: {
    topicsLoader: waiterLoader('topics')(
      () => ({ forumPath: null, page: 1, topics: [] }),
      (data, { forumPath, page }) => {
        return data.forumPath && forumPath && isEqual(data.forumPath, forumPath) && data.page === page
      },
      (state, { forumPath, page }) => new Promise((resolve) => resolve({ forumPath, page, topics: ycTopics }))
    ),
    stickyLoader: waiterLoader('stickyTopics')(
      () => ({ forumPath: null, stickyTopics: [] }),
      (data, { forumPath }) => data.forumPath && forumPath && isEqual(data.forumPath, forumPath),
      (state, { forumPath }) => new Promise((resolve) => resolve({ forumPath, stickyTopics: [] }))
    ),
    currentTopicLoader: waiterLoader('currentTopic')(
      () => ({ topicPath: null, topic: null }),
      (data, { topicPath }) => data.topicPath && topicPath && isEqual(data.topicPath, topicPath),
      (state, { topicPath }) =>
        new Promise((resolve) =>
          resolve({ topicPath, topic: ycTopics.find((topic) => topic.slug === topicPath[topicPath.length - 1]) })
        )
    ),
  },
  getters: {
    getTopics(state) {
      return state.topicsLoader.data.topics
    },
    getStickyTopics(state) {
      return state.stickyLoader.data.stickyTopics
    },
    getCurrentTopic(state) {
      return state.currentTopicLoader.data.topic
    }
  },
  actions: {
    async loadTopics({ dispatch }, args) {
      await dispatch('topicsLoader/loadData', args)
      await dispatch('stickyLoader/loadData', args)
    },
    async loadCurrentTopic({dispatch}, args) {
      await dispatch('currentTopicLoader/loadData', args)
    }
  },
}
