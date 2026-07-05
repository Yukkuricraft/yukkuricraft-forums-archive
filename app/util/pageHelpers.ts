import type { UseHeadInput } from '@unhead/vue'
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
  const calcFullUrl = (url: string | Ref<string>) => computed(() => {
    const urlVal = toValue(url)
    return urlVal.startsWith('http')
      ? url
      : `https://forumsarchive.yukkuricraft.net/${urlVal}`
  })

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
      rel: 'canonical' as const,
      href: fullUrl,
    })
  }

  return {
    title,
    meta,
    link,
  }
}
