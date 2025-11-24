import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { PrismaClientWithKysely } from '../index.js'
import { type Kysely } from 'kysely'
import type { DB } from '@yukkuricraft-forums-archive/database/kysely'
import {
  makePostOutObj,
  makeTopicOutObj,
  postQuery,
  postSelectQuery,
  type QueryParams,
  queryParams,
  topicQuery,
  topicSelectQuery,
} from '@yukkuricraft-forums-archive/types/search'
import { getAuthInfo } from './auth.js'

const app = new Hono().get('search', zValidator('query', queryParams), async (c) => {
  const params: QueryParams = c.req.valid('query')
  const prisma: PrismaClientWithKysely = c.get('prismaKysely')
  const kysely: Kysely<DB> = prisma.$kysely
  const authInfo = await getAuthInfo(c)

  let sortOrDefault = params.searchJSON.sort
  if (!sortOrDefault) {
    sortOrDefault =
      params.searchJSON.keywords || params.q ? { relevance: 'desc' as const } : { created: 'desc' as const }
  }

  const pageSize = 10

  if (params.searchJSON.title_only || params.searchJSON.starter_only || params.searchJSON.view === 'topic') {
    let query = topicSelectQuery(kysely, params)

    if (!authInfo?.isAdmin) {
      query = query.where('f.requiresAdmin', '=', false)
    }

    if (!authInfo?.isStaff) {
      query = query.where('f.requiresStaff', '=', false)
    }

    if (sortOrDefault.relevance) {
      query = query.orderBy('rank', sortOrDefault.relevance)
    }
    if (sortOrDefault.title) {
      query = query.orderBy('t.title', sortOrDefault.title)
    }
    if (sortOrDefault.author) {
      query = query.orderBy('u.name', sortOrDefault.author)
    }
    if (sortOrDefault.created) {
      query = query.orderBy('t.createdAt', sortOrDefault.created)
    }
    if (sortOrDefault.lastcontent) {
      query = query.orderBy('p.updatedAt', sortOrDefault.lastcontent)
    }
    if (sortOrDefault.replies) {
      query = query.orderBy('t.postCount', sortOrDefault.replies)
    }

    const [res, { count }] = await Promise.all([
      (async () =>
        await query
          .limit(pageSize)
          .offset(pageSize * (params.p - 1))
          .execute())(),
      (async () =>
        await topicQuery(kysely, params).select(kysely.fn.countAll<bigint>().as('count')).executeTakeFirstOrThrow())(),
    ])

    return c.json({ results: res.map((o) => makeTopicOutObj(o)), total: Number(count), type: 'topic' })
  } else {
    let query = postSelectQuery(kysely, params)

    if (!authInfo?.isAdmin) {
      query = query.where('f.requiresAdmin', '=', false)
    }

    if (!authInfo?.isStaff) {
      query = query.where('f.requiresStaff', '=', false)
    }

    if (sortOrDefault.relevance) {
      query = query.orderBy('rank', sortOrDefault.relevance)
    }
    if (sortOrDefault.title) {
      query = query.orderBy('t.title', sortOrDefault.title)
    }
    if (sortOrDefault.author) {
      query = query.orderBy('u.name', sortOrDefault.author)
    }
    if (sortOrDefault.created) {
      query = query.orderBy('p.createdAt', sortOrDefault.created)
    }
    if (sortOrDefault.lastcontent) {
      query = query.orderBy('p.updatedAt', sortOrDefault.lastcontent)
    }
    if (sortOrDefault.replies) {
      query = query.orderBy('t.postCount', sortOrDefault.replies)
    }

    const [res, { count }] = await Promise.all([
      (async () =>
        await query
          .limit(pageSize)
          .offset(pageSize * (params.p - 1))
          .execute())(),
      (async () =>
        await postQuery(kysely, params).select(kysely.fn.countAll<bigint>().as('count')).executeTakeFirstOrThrow())(),
    ])

    return c.json({ results: res.map((o) => makePostOutObj(o)), total: Number(count), type: 'post' })
  }
})

export default app
