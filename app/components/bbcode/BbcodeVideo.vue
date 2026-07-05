<template>
  <!-- https://css-tricks.com/lazy-load-embedded-youtube-videos/ -->
  <iframe
    v-if="ytId"
    class="image is-16by9"
    height="225"
    type="iframe"
    :src="`https://www.youtube-nocookie.com/embed/${ytId}`"
    :srcdoc="srcdoc"
    frameborder="0"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  youtube?: string
  // eslint-disable-next-line vue/prop-name-casing
  youtube_share?: string
}>()

const ytId = computed(() => {
  const raw = (props.youtube ?? props.youtube_share ?? '').trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) {
    return raw
  }
  const fromUrl = raw.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/)
  return fromUrl ? fromUrl[1] : null
})

const srcdoc = computed(
  () =>
    `<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube-nocookie.com/embed/${ytId.value}?autoplay=1><img src=https://img.youtube.com/vi/${ytId.value}/hqdefault.jpg><span>▶</span></a>`,
)
</script>
