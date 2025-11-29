<template>
  <nav class="navbar is-primary is-fixed-top" role="navigation" aria-level="main navigation">
    <div class="container">
      <div class="navbar-brand">
        <router-link :to="{ name: 'home' }" class="navbar-item has-text-white">
          Yukkuricraft forums archive
        </router-link>

        <button
          type="button"
          class="navbar-burger"
          :class="{ 'is-active': navbarExpanded }"
          aria-label="menu"
          :aria-expanded="navbarExpanded"
          @click="navbarExpanded = !navbarExpanded"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      <div class="navbar-menu" :class="{ 'is-active': navbarExpanded }">
        <div class="navbar-end">
          <router-link class="navbar-item has-text-white" :to="{ name: 'about' }">About</router-link>
          <div class="navbar-item">
            <label id="navbarSearch" class="sr-only"></label>
            <div class="field has-addons">
              <div class="control">
                <input
                  id="navbarSearch"
                  v-model="searchInput"
                  class="input"
                  type="search"
                  placeholder="Search..."
                  aria-label="Search for posts and topics"
                />
              </div>
              <div class="control">
                <router-link class="button" :to="{ name: 'search', query: { q: searchInput } }">Search</router-link>
              </div>
              <div class="control">
                <router-link class="button" :to="{ name: 'search', query: { q: searchInput, AdvSearch: '1' } }">
                  Advanced search
                </router-link>
              </div>
            </div>
          </div>
          <a v-if="!activeUser && !activeUserLoading" class="navbar-item" href="/oauth/discord">Log in</a>
          <div v-else-if="activeUser" class="navbar-item has-dropdown">
            <a class="navbar-link">
              <UserAvatar
                :width="32"
                :user-id="activeUser.id"
                :user-name="activeUser.name"
                :has-avatar="Boolean(activeUser.avatarId)"
                :thumbnail="true"
              />
            </a>

            <div class="navbar-dropdown">
              <router-link :to="{ name: 'user', params: { userId: activeUser.id, userName: activeUser.name } }">
                Me
              </router-link>
              <a class="navbar-item" href="/signout">Sign out</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onServerPrefetch, ref } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useQuery } from '@tanstack/vue-query'
import { NotFoundError, useApi } from '@/util/Api.ts'
import type { User } from '@yukkuricraft-forums-archive/types/user'

const navbarExpanded = ref(false)
const searchInput = ref('')

const api = useApi()
const { data: activeUser, isLoading: activeUserLoading, suspense: activeUserSuspense } = useQuery({
  queryKey: ['api', '@me'],
  queryFn: async ({ signal }) => {
    try {
      return await api.get<User>('/api/@me', undefined, signal)
    } catch (e) {
      if (e instanceof NotFoundError) {
        return null
      } else {
        throw e
      }
    }
  },
})

onServerPrefetch(activeUserSuspense)
</script>
