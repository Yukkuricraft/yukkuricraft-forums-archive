import Vue from 'vue'
import Vuex from 'vuex'

import sections from './sections'
import topics from './topics'
import posts from './posts'

Vue.use(Vuex)

export function createStore() {
  // eslint-disable-next-line import/no-named-as-default-member
  return new Vuex.Store({
    modules: {
      sections,
      topics,
      posts,
    },
  })
}
