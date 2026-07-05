<template>
  <figure class="image">
    <img
      v-if="hasAvatar && userId && userName"
      :style="{ width: `${width}px`, height: '100%' }"
      style="border-radius: 20%"
      :src="`/api/user/${userId}/avatar` + (thumbnail ? '/thumbnail' : '')"
      :alt="userName"
    />
    <svg
      v-else
      :style="{ width: `${width}px`, height: '100%' }"
      class="fa-user"
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="user"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
      <path
        class=""
        fill="currentColor"
        d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
      ></path>
    </svg>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  width: number
  userId: number | null | undefined
  userName: string | null | undefined
  hasAvatar: boolean
  thumbnail: boolean
}>()
</script>
