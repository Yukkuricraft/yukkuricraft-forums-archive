import { type Context, Hono } from 'hono'
import { createServer as createViteServer } from 'vite'
import type { HttpBindings } from '@hono/node-server'
import path from 'node:path'
import fs from 'node:fs/promises'
import { serveStatic } from '@hono/node-server/serve-static'
import { transformHtmlTemplate } from 'unhead/server'
import { type Unhead } from 'unhead/types'
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
  locales?: string | string[] | undefined,
) => Promise<{ html: string; preloadLinks: string; head: Unhead<any>; piniaState: string; queryClientState: string }>

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

    const template = await fs.readFile(templatePath, 'utf-8')

    const render: Render = (await import('@yukkuricraft-forums-archive/frontend/distserver/entry-server.js')).render

    const manifest = await import('@yukkuricraft-forums-archive/frontend/dist/.vite/ssr-manifest.json', {
      with: {
        type: 'json',
      },
    })

    return [
      () => Promise.resolve(template),
      async (url: string, port: number, locales: string | string[] | undefined) =>
        // TODO: Set https here conditionally
        // TODO: Set base here conditionally
        await render(url, manifest.default, `http://localhost:${port}/`, locales),
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

    let template = (await fs.readFile(path.resolve(viteRoot, 'index.html'), 'utf-8')).replace(
      '/src/entry-client.ts',
      '/@fs/' + path.resolve(viteRoot, './src/entry-client.ts'),
    )

    app.use('*', async (c, next) => {
      // A bit hacky, but generally seems to work most of the time
      await new Promise((resolve, reject) => {
        try {
          vite.middlewares(c.env.incoming, c.env.outgoing, resolve)
        } catch (e) {
          reject(e)
        }
      })
      await next()
    })

    const render: Render = (await vite.ssrLoadModule(path.resolve(viteRoot, './src/entry-server.js'))).render

    return [
      async (url: string) => await vite.transformIndexHtml(url, template),
      async (url: string, port: number, locales: string | string[] | undefined) =>
        await render(url, {}, `http://localhost:${port}/`, locales),
      (e: any) => vite.ssrFixStacktrace(e),
    ] as const
  }
})()

async function handle(c: Context) {
  const port = c.get('addressInfo').port
  if (!port) {
    throw new AppError('Not port defined', false)
  }

  try {
    console.log('Rendering: ' + c.req.path)

    const rendered = await render(c.req.path, port, c.get('language'))
    const baseTemplate = await template(c.req.path)

    const stateScript = `<script id="pinia-state">
  window.__PINIA_STATE__ = ${JSON.stringify(rendered.piniaState)}
  window.__QUERY_CLIENT_STATE__ = ${JSON.stringify(rendered.queryClientState)}
 </script>`

    const reqTemplate = baseTemplate
      .replace('<!--preload-links-->', rendered.preloadLinks ?? '')
      .replace('<!--app-html-->', rendered.html ?? '')
      .replace('<!--state-script-->', stateScript ?? '')

    const templateWithHead = await transformHtmlTemplate(rendered.head, reqTemplate)

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
