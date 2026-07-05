<template>
  <div class="site" style="height: 100%">
    <Navbar />

    <div class="site-content">
      <div
        id="contentRoot"
        class="container"
        :class="{ 'container-error': route.meta.isError, 'is-wide': settingsStore.wideScreen }"
      >
        <YcBreadcrumbs />
        <ErrorState v-if="appErrorStore.status" :status="appErrorStore.status" />
        <NuxtPage v-else />
      </div>
    </div>

    <Footer class="mt-5" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/ErrorState.vue'
import Navbar from '@/components/forum/ForumsNavbar.vue'
import YcBreadcrumbs from '@/components/YcBreadcrumbs.vue'
import Footer from '@/components/YcFooter.vue'
import { useAppErrorStore } from '@/stores/appError.js'
import { useSettingsStore } from '@/stores/settings.js'

const route = useRoute()
const appErrorStore = useAppErrorStore()

// Apply persisted viewer preferences only after hydration to avoid an SSR mismatch
const settingsStore = useSettingsStore()
onMounted(() => settingsStore.loadFromStorage())
</script>
