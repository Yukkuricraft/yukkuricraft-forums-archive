import type { UseHeadInput } from '@unhead/vue'
import type { UseSeoMetaInput } from '@unhead/vue/types'
import { computed, isRef } from 'vue'

import faviconUpscaledI from '../favicon_upscaled.png'
import type { MaybeRefOrGetter } from '@vue/reactivity'

export const faviconUpscaled = faviconUpscaledI

interface MakeMetaOptions {
  title?: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  image?: MaybeRefOrGetter<string>
  url: MaybeRefOrGetter<string> | null
}

function calcFullUrl(url: MaybeRefOrGetter<string>) {
  return computed(() => {
    let urlVal = toValue(url)
    if (urlVal === '') {
      urlVal += '/'
    }

    return urlVal.startsWith('http') ? urlVal : `https://forumsarchive.yukkuricraft.net${urlVal}`
  })
}

export function makeSeoMeta({ title, description, image, url }: MakeMetaOptions): UseSeoMetaInput {
  const usedImage = isRef(image) ? computed(() => image.value ?? faviconUpscaled) : (image ?? faviconUpscaled)

  const fullTitle = computed(() => {
    const titleVal = toValue(title)
    return titleVal ? `Yukkuricraft Forums Archive - ${titleVal}` : 'Yukkuricraft Forums Archive'
  })

  return {
    title: fullTitle,
    ogTitle: fullTitle,
    description,
    ogDescription: description,
    ogUrl: url && calcFullUrl(url),
    ogImage: usedImage,
  }
}

export function makeMeta({ url }: MakeMetaOptions): UseHeadInput {
  const link = []

  if (url) {
    link.push({
      rel: 'canonical' as const,
      href: calcFullUrl(url),
    })
  }

  return {
    link,
  }
}

export function useStandardHead(options: MakeMetaOptions) {
  useHead(makeMeta(options))
  useSeoMeta(makeSeoMeta(options))
}
