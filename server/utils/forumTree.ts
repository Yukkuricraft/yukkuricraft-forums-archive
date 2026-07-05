import { type H3Event, createError } from 'h3'
import type { Forum } from '~~/generated/prisma/client.js'

import type { ForumTreeNode } from '#shared/types/forum'

import { getAuthInfo } from './auth'
import { prismaKysely } from './db'
import { getForumsBySlugQuery } from './queries/forum'

export async function getForumBySlug(slug: string[], event: H3Event) {
  const slugWithoutEnd = slug.at(-1)?.length === 0 ? slug.slice(0, -1) : slug
  const userInfo = await getAuthInfo(event)

  const res = await getForumsBySlugQuery(prismaKysely.$kysely, slugWithoutEnd, {
    isAdmin: userInfo?.isAdmin ?? false,
    isStaff: userInfo?.isStaff ?? false,
  }).execute()
  if (res.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  function makeForumTree(id: number, remaining: Forum[], depth: number): [Forum[], ForumTreeNode[]] {
    const subForums = remaining.filter((f) => f.parentId === id)
    let newRemaining = remaining.filter((f) => f.parentId !== id)

    const res = subForums.map((f) => {
      const [newR, subs] = makeForumTree(f.id, newRemaining, depth + 1)
      newRemaining = newR
      subs.sort((a, b) => a.displayorder - b.displayorder)
      return { ...f, subForums: subs }
    })

    return [newRemaining, res]
  }

  const [remaining, roots] = makeForumTree(1, res, 0)
  if (remaining.length > 0) {
    throw new Error(`Could not attach all forums to tree: ${JSON.stringify(remaining)}`)
  }

  return roots
}
