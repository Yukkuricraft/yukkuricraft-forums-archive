import { type Context, Hono } from 'hono'
import { createServer as createViteServer } from 'vite'
import type { HttpBindings } from '@hono/node-server'
import path from 'node:path'
import fs from 'node:fs/promises'
import { serveStatic } from '@hono/node-server/serve-static'
import { transformHtmlTemplate } from 'unhead/server'
import { type SSRHeadPayload, type Unhead } from 'unhead/types'
import AppError from '../AppError.js'
import { languageDetector } from 'hono/language'

const isProduction = process.env.NODE_ENV === 'production'

const app = new Hono<{ Bindings: HttpBindings }>().use(
  languageDetector({
    fallbackLanguage: 'en',
  }),
)

type Render = (
  url: string,
  manifest: { [k: string]: string[] },
  requestsBase: string,
  locales: string | string[] | undefined,
  cookieHeader: string | null,
) => Promise<{
  html: string
  preloadLinks: string
  // Loosely typed to match the dynamically imported frontend render output (VueHeadClient) and
  // unhead's own transformHtmlTemplate signature, which likewise uses Unhead<any, SSRHeadPayload>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  head: Unhead<any, SSRHeadPayload>
  piniaState: string
  queryClientState: string
}>

function fileCwd() {
  const cwd = process.cwd()
  const withSlash = cwd.startsWith('/') ? cwd : '/' + cwd
  return 'file://' + withSlash
}

const [template, render, fixStacktrace] = await (async () => {
  if (isProduction) {
    const templatePath = path.relative(
      fileCwd(),
      import.meta.resolve('@yukkuricraft-forums-archive/frontend/dist/index.html'),
    )
    const assetsRoot = path.dirname(templatePath)

    app.use('assets/*', serveStatic({ root: assetsRoot }))

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is resolved from a bundled package at build time, not user input
    const template = await fs.readFile(templatePath, 'utf-8')

    const render: Render = (await import('@yukkuricraft-forums-archive/frontend/distserver/entry-server.js')).render

    const manifest = await import('@yukkuricraft-forums-archive/frontend/dist/.vite/ssr-manifest.json', {
      with: {
        type: 'json',
      },
    })

    return [
      () => Promise.resolve(template),
      async (url: string, port: number, locales: string | string[] | undefined, cookieHeader: string | null) =>
        await render(url, manifest.default, `http://localhost:${port}/`, locales, cookieHeader),
      undefined,
    ] as const
  } else {
    const viteRoot = path.dirname(
      path.relative(fileCwd(), import.meta.resolve('@yukkuricraft-forums-archive/frontend/index.html')),
    )

    const viteDevConfig = (await import('@yukkuricraft-forums-archive/frontend/vite.config.js')).default

    const vite = await createViteServer({
      ...viteDevConfig,
      //root: viteRoot,
      server: { middlewareMode: true },
      appType: 'custom',
    })

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- viteRoot is resolved from a bundled package at build time, not user input
    const template = (await fs.readFile(path.resolve(viteRoot, 'index.html'), 'utf-8')).replace(
      '/src/entry-client.ts',
      '/@fs/' + path.resolve(viteRoot, './src/entry-client.ts'),
    )

    app.use('*', async (c, next) => {
      // A bit hacky, but generally seems to work most of the time
      await new Promise<void>((resolve, reject) => {
        try {
          vite.middlewares(c.env.incoming, c.env.outgoing, (err: unknown) => {
            if (err) {
              return reject(err instanceof Error ? err : new Error('Vite middleware error', { cause: err }))
            } else {
              return resolve()
            }
          })
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Vite middleware error', { cause: e }))
        }
      })
      await next()
    })

    const render = (await vite.ssrLoadModule(path.resolve(viteRoot, './src/entry-server.js'))).render as Render

    return [
      async (url: string) => await vite.transformIndexHtml(url, template),
      async (url: string, port: number, locales: string | string[] | undefined, cookieHeader: string | null) =>
        await render(url, {}, `http://localhost:${port}/`, locales, cookieHeader),
      (e: unknown) => vite.ssrFixStacktrace(e as Error),
    ] as const
  }
})()

async function handle(c: Context) {
  const port = c.get('addressInfo').port
  const cookieHeader = c.req.raw.headers.get('Cookie')
  if (!port) {
    throw new AppError('Not port defined', false)
  }

  try {
    const renderUrl = c.req.path + new URL(c.req.url).search
    console.log('Rendering: ' + renderUrl)

    const rendered = await render(renderUrl, port, c.get('language'), cookieHeader)
    const baseTemplate = await template(c.req.path)

    const stateScript = `<script id="pinia-state">
  window.__PINIA_STATE__ = ${JSON.stringify(rendered.piniaState)}
  window.__QUERY_CLIENT_STATE__ = ${JSON.stringify(rendered.queryClientState)}
 </script>`

    const reqTemplate = baseTemplate
      .replace('<!--preload-links-->', rendered.preloadLinks ?? '')
      .replace('<!--app-html-->', rendered.html ?? '')
      .replace('<!--state-script-->', stateScript ?? '')

    const templateWithHead = transformHtmlTemplate(rendered.head, reqTemplate)

    return c.html(templateWithHead, 200)
  } catch (e) {
    if (fixStacktrace) {
      fixStacktrace(e)
    }
    throw e
  }
}

app.get('/:path{(?!assets).*}', async (c) => {
  return await handle(c)
})
app.get('/', async (c) => {
  return await handle(c)
})

export default app
