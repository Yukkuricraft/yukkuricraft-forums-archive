<template>
  <div class="site" style="height: 100%">
    <Navbar />

    <div class="site-content">
      <div id="contentRoot" class="container" :class="route.meta.isError ? 'container-error' : ''">
        <YcBreadcrumbs />
        <router-view v-slot="{ Component }">
          <template v-if="Component">
            <Suspense>
              <component :is="Component" />

              <template #fallback>
                <div style="text-align: center; margin-top: 20vh; margin-bottom: 20vh">
                  <FontAwesomeIcon :icon="faSpinner" spin />
                </div>
              </template>
            </Suspense>
          </template>
        </router-view>
      </div>
    </div>

    <Footer class="mt-5" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/forum/ForumsNavbar.vue'
import Footer from './components/YcFooter.vue'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import YcBreadcrumbs from '@/components/YcBreadcrumbs.vue'
import { useSettingsStore } from '@/stores/settings.ts'

const route = useRoute()

// Apply persisted viewer preferences only after hydration to avoid an SSR mismatch
const settingsStore = useSettingsStore()
onMounted(() => settingsStore.loadFromStorage())
</script>
