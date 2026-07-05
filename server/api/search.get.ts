import { defineEventHandler, getValidatedQuery } from 'h3'
import type { Kysely } from 'kysely'
import type { DB } from '~~/generated/kysely/types.js'

import { makePostOutObj, makeTopicOutObj, type QueryParams, queryParams } from '#shared/types/search'

import { getAuthInfo } from '../utils/auth'
import { prismaKysely } from '../utils/db'
import { postQuery, postSelectQuery, topicQuery, topicSelectQuery } from '../utils/queries/search'

export default defineEventHandler(async (event) => {
  const params: QueryParams = await getValidatedQuery(event, queryParams.parse)
  const kysely: Kysely<DB> = prismaKysely.$kysely
  const authInfo = await getAuthInfo(event)

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

    return { results: res.map((o) => makeTopicOutObj(o)), total: Number(count), type: 'topic' as const }
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

    return { results: res.map((o) => makePostOutObj(o)), total: Number(count), type: 'post' as const }
  }
})
