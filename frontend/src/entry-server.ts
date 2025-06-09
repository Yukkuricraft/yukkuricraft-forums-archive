import { basename } from 'node:path'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createHead } from '@unhead/vue/server'
import { type VueHeadClient } from '@unhead/vue'
import { createYcForumsApp } from '@/app.ts'

export async function render(
  url: string,
  manifest: { [k: string]: string[] },
): Promise<{ html: string; preloadLinks: string; head: VueHeadClient; piniaState: string }> {
  const { app, router, pinia } = createYcForumsApp()
  const head = createHead()
  app.use(head)

  await router.push(url)
  await router.isReady()

  const ctx: SSRContext = {}
  const html = await renderToString(app, ctx)

  const preloadLinks = renderPreloadLinks(ctx.modules, manifest)
  const piniaState = pinia.state.value
  return { html, preloadLinks, head, piniaState: JSON.stringify(piniaState) }
}

function renderPreloadLinks(modules: string[], manifest: { [k: string]: string[] }) {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files: string[] | undefined = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file: string) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else if (file.endsWith('.woff')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  } else if (file.endsWith('.woff2')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  } else if (file.endsWith('.gif')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
  } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
  } else if (file.endsWith('.png')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`
  } else if (file.endsWith('.webp')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/webp">`
  } else {
    console.warn("Tried to render file but don't know how: " + file)
  }
}
