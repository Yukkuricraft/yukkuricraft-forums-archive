import { type Context, Hono } from 'hono'
import { type Forum, PrismaClient } from '@prisma/client'
import { getForumsBySlug } from '@prisma/client/sql'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import AppError from '../AppError.js'

export interface ForumTree extends Forum {
  subForums: ForumTree[]
}

async function getForumBySlug(slug: string[], c: Context) {
  const slugWithoutEnd = slug.at(-1)?.length === 0 ? slug.slice(0, -1) : slug

  const prisma: PrismaClient = c.get('prisma')
  prisma.forum.findMany()

  const res = await prisma.$queryRawTyped(getForumsBySlug(slugWithoutEnd))
  if (res.length === 0) {
    return c.json({ error: 'not found' }, 404)
  }

  const resAsForums = res.map<Forum>((r) => ({
    id: r.id,
    parentId: r.parent_id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    displayorder: r.displayorder,
    topicsCount: r.topics_count,
    postsCount: r.posts_count,
  }))

  function makeForumTree(id: number, remaining: Forum[], depth: number): [Forum[], Forum[]] {
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

  const [remaining, roots] = makeForumTree(1, resAsForums, 0)
  if (remaining.length > 0) {
    throw new AppError(`Could not attach all forums to tree: ${JSON.stringify(remaining)}`, true)
  }

  return c.json(roots)
}

const app = new Hono()
  .get('forums/:forumId', zValidator('param', z.object({ forumId: z.string().pipe(z.coerce.number()) })), async (c) => {
    const { forumId: parentId } = c.req.valid('param')
    const prisma: PrismaClient = c.get('prisma')
    const forums = await prisma.forum.findMany({
      where: {
        OR: [{ parentId }, { id: parentId }],
      },
    })

    const parent = forums.find((f) => f.id === parentId)
    const children = forums.filter((f) => f.parentId === parentId)

    if (!parent && children.length > 0) {
      throw new AppError(`Found children without parent. Children: ${JSON.stringify(children)}`, true)
    }

    if (!parent) {
      return c.json({ error: 'not found' }, 404)
    }

    children.sort((a, b) => a.displayorder - b.displayorder)

    return c.json({ ...parent, subForums: children })
  })
  .get('forumsBySlug/:slug{.*}', async (c) => {
    return await getForumBySlug(c.req.param('slug').split('/'), c)
  })
  .get('forumsBySlug/', async (c) => {
    return await getForumBySlug([], c)
  })

export default app