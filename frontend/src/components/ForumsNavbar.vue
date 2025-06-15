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
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const navbarExpanded = ref(false)
const searchInput = ref('')
</script>
