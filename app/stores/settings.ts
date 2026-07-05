import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SHOW_SIGNATURES_KEY = 'showSignatures'
const WIDE_SCREEN_KEY = 'wideScreen'

export const useSettingsStore = defineStore('settings', () => {
  const showSignatures = ref(true)
  const wideScreen = ref(false)

  function loadFromStorage() {
    if (typeof window === 'undefined') {
      return
    }

    const storedSignatures = window.localStorage.getItem(SHOW_SIGNATURES_KEY)
    if (storedSignatures !== null) {
      showSignatures.value = storedSignatures === 'true'
    }

    const storedWideScreen = window.localStorage.getItem(WIDE_SCREEN_KEY)
    if (storedWideScreen !== null) {
      wideScreen.value = storedWideScreen === 'true'
    }
  }

  watch(showSignatures, (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SHOW_SIGNATURES_KEY, String(value))
    }
  })

  watch(wideScreen, (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WIDE_SCREEN_KEY, String(value))
    }
  })

  return {
    showSignatures,
    wideScreen,
    loadFromStorage,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
