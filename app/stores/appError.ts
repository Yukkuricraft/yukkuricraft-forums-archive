import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppErrorStore = defineStore('appError', () => {
  const status = ref<number | null>(null)

  function setStatus(s: number) {
    status.value = s
  }

  function clear() {
    status.value = null
  }

  return { status, setStatus, clear }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppErrorStore, import.meta.hot))
}
