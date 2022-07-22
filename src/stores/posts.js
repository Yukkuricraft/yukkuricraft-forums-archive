import isEqual from 'lodash/isEqual'
import waiterLoader from './waiterLoader'

export default {
  namespaced: true,
  modules: {
    postsLoader: waiterLoader('posts')(
      () => ({ topicPath: null, page: 1, posts: [] }),
      (data, { topicPath, page }) => {
        return data.topicPath && topicPath && isEqual(data.topicPath, topicPath) && data.page === page
      },
      (state, { topicPath, page }) =>
        new Promise((resolve) => resolve({ topicPath, page, posts: [{ content: 'foo' }, { content: 'bar' }] }))
    ),
  },
  getters: {
    getPosts(state) {
      return state.postsLoader.data.posts
    },
  },
  actions: {
    async loadPosts({ dispatch }, args) {
      await dispatch('postsLoader/loadData', args)
    },
  },
}
