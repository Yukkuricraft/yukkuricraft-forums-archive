import { type UseHeadInput } from '@unhead/vue'
import type { Ref } from 'vue'
import { computed, isRef } from 'vue'

import faviconUpscaledI from '../favicon_upscaled.png'

export const faviconUpscaled = faviconUpscaledI

export function makeMeta({
  title,
  description,
  image,
  url,
}: {
  title: string | Ref<string>
  description: string | Ref<string>
  image?: string | Ref<string>
  url: string | Ref<string> | null
}): UseHeadInput {
  const calcFullUrl = (url: string | Ref<string>) =>
    (isRef(url) ? url.value : url).startsWith('http')
      ? url
      : isRef(url)
        ? computed(() => 'https://forumsarchive.yukkuricraft.net/' + url.value)
        : 'https://forumsarchive.yukkuricraft.net/' + url

  const usedImage = isRef(image) ? computed(() => image.value ?? faviconUpscaled) : (image ?? faviconUpscaled)

  const meta = [
    {
      property: 'description',
      content: description,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:image',
      content: usedImage,
    },
  ]

  const link = []

  if (url) {
    const fullUrl = calcFullUrl(url)
    meta.push({
      property: 'og:url',
      content: fullUrl,
    })

    link.push({
      rel: 'canonical',
      href: fullUrl,
    })
  }

  return {
    title,
    meta,
    link,
  }
}
