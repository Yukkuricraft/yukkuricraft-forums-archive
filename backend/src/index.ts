import 'dotenv/config'
import getenv from 'getenv'
import { PrismaClient } from '@prisma/client'
import kyselyExtension from 'prisma-extension-kysely'
import { CamelCasePlugin, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely'
import type { DB } from './generated/kysely/types.js'

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger as honoLogger } from 'hono/logger'
import { compress } from 'hono/compress'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { createMiddleware } from 'hono/factory'

import { rootLogger } from './loggers.js'

import forumRoutes from './routes/forum.js'
import topicRoutes from './routes/topic.js'
import postsRoutes from './routes/posts.js'
import userRoutes from './routes/user.js'
import miscRoutes from './routes/misc.js'
import interopRoutes from './routes/interop.js'
import searchRoutes from './routes/search.js'

const [prisma, prismaWithKysely] = (() => {
  const prisma = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'query', emit: 'stdout' },
    ],
  })
  prisma.$on('error', (event) => rootLogger.error(event))
  prisma.$on('warn', (event) => rootLogger.warn(event))

  return [prisma, prisma.$extends(
    kyselyExtension({
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createDriver: () => driver,
            createAdapter: () => new PostgresAdapter(),
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new PostgresQueryCompiler(),
          },
          plugins: [new CamelCasePlugin()],
        }),
    }),
  )]
})()

export type PrismaClientWithKysely = typeof prismaWithKysely

const contextProvider = createMiddleware(async (c, next) => {
  c.set('prisma', prisma)
  c.set('prismaKysely', prismaWithKysely)
  c.set(
    'logger',
    rootLogger.child({ defaultMeta: { method: c.req.method, url: c.req.path, requestId: c.get('requestId') } }),
  )
  await next()
})

const app = new Hono()
  .use(contextProvider)
  .use(honoLogger(rootLogger.info))
  .use(compress())
  .use(requestId())
  .use(secureHeaders({ strictTransportSecurity: false }))
  .use(timeout(30_000))

app.route('/api', forumRoutes)
app.route('/api', topicRoutes)
app.route('/api', postsRoutes)
app.route('/api', userRoutes)
app.route('/api', miscRoutes)
app.route('/api', searchRoutes)
app.route('/', interopRoutes)

app.onError((err, c) => {
  if ('getResponse' in err) {
    const res = err.getResponse()
    return c.newResponse(res.body, res)
  }

  rootLogger.error(err)
  return c.text(`Internal error. Id: ${c.get('requestId')}`, 500)
})

// export type AppType = typeof app

serve(
  {
    fetch: app.fetch,
    port: getenv.int('HTTP_PORT', 3000),
    hostname: process.env.HTTP_HOST,
  },
  (info) => {
    rootLogger.info(`Server is running on http://localhost:${info.port}`)
  },
)
