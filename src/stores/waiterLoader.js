import Vue from 'vue'

export default (name) => (defaultData, dataIsDefined, loadData) => {
  return {
    namespaced: true,
    state: () => ({
      data: defaultData(),
      loading: false,
      waiters: [],
    }),
    getters: {},
    mutations: {
      startLoading(state) {
        state.loading = true
      },
      registerWaiter(state, { resolve }) {
        state.waiters.push(resolve)
      },
      setData(state, { data }) {
        Vue.set(state, 'data', data)
      },
      endLoading(state) {
        state.loading = false
        for (const waiter of state.waiters) {
          waiter()
        }
        state.waiters = []
      },
    },
    actions: {
      async loadData({ state, commit }, args) {
        if (state.loading) {
          await new Promise((resolve) => commit({ type: 'registerWaiter', resolve }))
          return
        }

        console.log('Loading data for ' + name)
        if (dataIsDefined(state.data, args)) {
          console.log('Existing data is fine for ' + name)
          return
        }
        console.log('Data dirty for ' + name + '. Loading new data')

        commit('startLoading')

        const data = await loadData(state, args)

        commit({ type: 'setData', data })
        commit('endLoading')
      },
    },
  }
}
