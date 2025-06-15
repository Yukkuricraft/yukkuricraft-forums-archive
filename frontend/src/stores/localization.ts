import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLocaleStore = defineStore('locale', () => {
  const locales = ref<string | string[] | undefined>(undefined)

  const numberFormat = computed(() => new Intl.NumberFormat(locales.value))

  const dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(locales.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  )

  const monthYearFormat = computed(() => new Intl.DateTimeFormat(locales.value, { month: 'short', year: 'numeric' }))

  function formatNumber(num: number) {
    return numberFormat.value.format(num)
  }

  function formatDate(date: string | Date | undefined | null) {
    if (date === null || date === undefined) {
      return ''
    }

    if (date instanceof Date) {
      return dateFormat.value.format(date)
    } else {
      return dateFormat.value.format(new Date(date))
    }
  }

  function formatMonthYear(date: string | Date | undefined | null) {
    if (date === null || date === undefined) {
      return ''
    }

    if (date instanceof Date) {
      return dateFormat.value.format(date)
    } else {
      return dateFormat.value.format(new Date(date))
    }
  }

  return {
    locales,
    numberFormat,
    dateFormat,
    monthYearFormat,
    formatNumber,
    formatDate,
    formatMonthYear,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLocaleStore, import.meta.hot))
}
