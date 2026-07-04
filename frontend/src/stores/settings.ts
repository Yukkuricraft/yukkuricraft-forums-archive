import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SHOW_SIGNATURES_KEY = 'showSignatures'

export const useSettingsStore = defineStore('settings', () => {
  const showSignatures = ref(true)

  function loadFromStorage() {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(SHOW_SIGNATURES_KEY)
    if (stored !== null) {
      showSignatures.value = stored === 'true'
    }
  }

  watch(showSignatures, (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SHOW_SIGNATURES_KEY, String(value))
    }
  })

  return {
    showSignatures,
    loadFromStorage,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
