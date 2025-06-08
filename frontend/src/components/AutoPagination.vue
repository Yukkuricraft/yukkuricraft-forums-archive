<template>
  <nav class="pagination is-centered" role="navigation" aria-label="pagination">
    <ul class="pagination-list">
      <template v-if="!shownMiddlePages.includes(1)">
        <li>
          <router-link v-if="linkGen" class="pagination-link" :to="linkGen(1)">1</router-link>
          <a v-if="navigateToPage" class="pagination-link" href="#" @click.prevent="navigateToPage(1)">1</a>
        </li>
        <li v-if="shownMiddlePages.includes(3)">
          <router-link v-if="linkGen" class="pagination-link" :to="linkGen(2)">2</router-link>
          <a v-if="navigateToPage" class="pagination-link" href="#" @click.prevent="navigateToPage(2)">2</a>
        </li>
        <li v-else><span class="pagination-ellipsis">&hellip;</span></li>
      </template>

      <li v-for="page in shownMiddlePages" :key="page">
        <router-link
          v-if="linkGen"
          :to="linkGen(page)"
          class="pagination-link"
          :class="page === currentPage && 'is-current'"
        >
          {{ page }}
        </router-link>
        <a
          v-if="navigateToPage"
          class="pagination-link"
          href="#"
          @click.prevent="navigateToPage(page)"
          :class="page === currentPage && 'is-current'"
        >
          {{ page }}
        </a>
      </li>

      <template v-if="pageCount !== 1 && !shownMiddlePages.includes(pageCount)">
        <li v-if="shownMiddlePages.includes(pageCount - 1)">
          <router-link v-if="linkGen" class="pagination-link" :to="linkGen(pageCount - 1)">{{
            pageCount - 1
          }}</router-link>
          <a v-if="navigateToPage" class="pagination-link" href="#" @click.prevent="navigateToPage(pageCount - 1)"></a>
        </li>
        <li v-else><span class="pagination-ellipsis">&hellip;</span></li>
        <li>
          <router-link v-if="linkGen" class="pagination-link" :to="linkGen(pageCount)">{{ pageCount }}</router-link>
          <a v-if="navigateToPage" class="pagination-link" href="#" @click.prevent="navigateToPage(pageCount)">{{
            pageCount
          }}</a>
        </li>
      </template>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  pageCount: number
  linkGen?: (page: number) => RouteLocationRaw
  navigateToPage?: (page: number) => void
  shownPages: number
}>()

const middleShownPages = computed(() => props.shownPages - 4)

const shownMiddlePages = computed(() => {
  const arr: number[] = [props.currentPage]
  let includedEndAdditions = 0
  const endAdditions: number[] = [1, 2, props.pageCount, props.pageCount - 1]

  if (endAdditions.includes(props.currentPage)) {
    includedEndAdditions += 1
  }

  for (let i = 1; arr.length < middleShownPages.value + includedEndAdditions; i++) {
    const prevPage = props.currentPage - i
    if (prevPage > 0) {
      arr.unshift(prevPage)

      if (endAdditions.includes(prevPage)) {
        includedEndAdditions += 1
      }
    }

    const nextPage = props.currentPage + i
    if (nextPage <= props.pageCount) {
      arr.push(nextPage)

      if (endAdditions.includes(nextPage)) {
        includedEndAdditions += 1
      }
    }

    if (prevPage <= 0 && nextPage > props.pageCount) {
      break
    }

    if (i > 100) {
      throw new Error(
        `Pagination could not calculate pages to show ${{
          prevPage,
          nextPage,
          middleShownPages: middleShownPages.value,
        }}`,
      )
    }
  }

  return arr
})
</script>
