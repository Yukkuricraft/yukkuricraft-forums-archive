import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { PrismaClient } from '@yukkuricraft-forums-archive/database'
import contentDisposition from 'content-disposition'
import * as mime from 'mime-types'
import AppError from '../AppError.js'
import { userInclude } from '@yukkuricraft-forums-archive/types/user'

const app = new Hono()
  .get('dumpAllAvatars', async (c) => {
    const prisma: PrismaClient = c.get('prisma')
    const logger = c.get('logger')

    const usersWithAvatars = await prisma.user.findMany({
      select: {
        id: true,
        avatarId: true,
      },
      where: {
        Avatar: {
          isNot: null,
        },
      },
    })
    logger.info(`Dumping ${usersWithAvatars.length * 2} avatars`)

    async function getBytes(url: string) {
      const res = await fetch(url)

      if (!res.ok) {
        throw new AppError(`Could not dump avatar at ${url}`, true)
      }

      return await res.bytes()
    }

    let i = 0
    for (const u of usersWithAvatars) {
      if (i % 10 == 0) {
        logger.info(`Dumped ${i * 2}/${usersWithAvatars.length * 2} avatars`)
      }

      await prisma.avatar.update({
        where: {
          id: u.avatarId!,
        },
        data: {
          data: await getBytes(`https://forums.yukkuricraft.net/core/image.php?userid=${u.id}`),
          thumbnailData: await getBytes(`https://forums.yukkuricraft.net/core/image.php?userid=${u.id}&thumb=1`),
        },
      })
      i++
    }

    logger.info(`All avatars dumped`)

    return c.text('Avatars dumped')
  })
  .get(
    'user/:userId',
    zValidator('param', z.object({ userId: z.string().pipe(z.coerce.number().int()) })),
    async (c) => {
      const { userId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      const user = await prisma.user.findUnique({
        include: userInclude,
        where: {
          id: userId,
        },
      })

      if (user === null) {
        return c.json({ error: 'not found' }, 404)
      }

      return c.json(user)
    },
  )
  .get('users', async (c) => {
    const userIds = c.req.queries('userId')
    const prisma: PrismaClient = c.get('prisma')

    if (userIds === undefined || userIds.length === 0) {
      return c.json({ error: 'no user ids provided' }, 400)
    }

    const invalidUserIds = userIds.filter((id) => isNaN(Number(id)))
    if (invalidUserIds.length > 0) {
      return c.json({ error: 'invalid user ids', idx: invalidUserIds }, 400)
    }

    const userIdNums = userIds.map((id) => Number(id))

    const users = await prisma.user.findMany({
      include: userInclude,
      where: {
        id: {
          in: userIdNums,
        },
      },
    })

    return c.json(users)
  })
  .get(
    'user/:userId/avatar',
    zValidator('param', z.object({ userId: z.string().pipe(z.coerce.number().int()) })),
    async (c) => {
      const { userId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      const logger = c.get('logger')
      const user = await prisma.user.findUnique({
        select: {
          Avatar: {
            select: {
              filename: true,
              data: true,
              extension: true,
            },
          },
        },
        where: {
          id: userId,
        },
      })

      if (user === null || user.Avatar === null) {
        return c.notFound()
      }

      return c.body(user.Avatar.data, 200, {
        'content-type': mime.contentType(user.Avatar.filename) || 'application/octet-stream',
        'content-disposition': contentDisposition(user.Avatar.filename, { type: 'inline' }),
      })
    },
  )
  .get(
    'user/:userId/avatar/thumbnail',
    zValidator('param', z.object({ userId: z.string().pipe(z.coerce.number().int()) })),
    async (c) => {
      const { userId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      const user = await prisma.user.findUnique({
        select: {
          Avatar: {
            select: {
              filename: true,
              thumbnailData: true,
              extension: true,
            },
          },
        },
        where: {
          id: userId,
        },
      })

      if (user === null || user.Avatar === null || user.Avatar.thumbnailData === null) {
        return c.notFound()
      }

      return c.body(user.Avatar.thumbnailData, 200, {
        'content-type': mime.contentType(user.Avatar.filename) || 'application/octet-stream',
        'content-disposition': contentDisposition(user.Avatar.filename, { type: 'inline' }),
      })
    },
  )

export default app
