import { type Context, Hono } from 'hono'
import getenv from 'getenv'
import z from 'zod'

import { Discord, generateState, UnexpectedResponseError } from 'arctic'
import { zValidator } from '@hono/zod-validator'
import AppError from '../AppError.js'
import type { PrismaClient } from '@yukkuricraft-forums-archive/database'
import discordIdMappings from './discordIdMappings.js'
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

const discord = new Discord(
  getenv('DISCORD_CLIENT_ID'),
  getenv('DISCORD_CLIENT_SECRET'),
  getenv('DISCORD_REDIRECT_URI'),
)

const app = new Hono()
app
  .get('oauth/discord', (c) => {
    const state = generateState()
    const scopes = ['identify', 'email']
    const url = discord.createAuthorizationURL(state, null, scopes)
    return c.redirect(url)
  })
  .get(
    'oauth_callback/discord',
    zValidator(
      'query',
      z.object({
        code: z.string(),
        state: z.string(),
      }),
    ),
    async (c) => {
      const { code } = c.req.valid('query')
      const prisma: PrismaClient = c.get('prisma')

      let tokens
      try {
        tokens = await discord.validateAuthorizationCode(code, null)
      } catch (e) {
        if (e instanceof UnexpectedResponseError) {
          throw new AppError(`Discord request failed with code ${e.status}: ${e.message}`, true)
        } else {
          throw e
        }
      }

      const discordResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      })
      if (!discordResponse.ok) {
        throw new AppError('Failed to get user', true)
      }

      const discordUser = (await discordResponse.json()) as {
        id: string
        email: string
        global_name?: string
        username: string
      }
      const user = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          isStaff: true,
          isAdmin: true,
        },
        where: {
          OR: [{ email: discordUser.email }, { id: discordIdMappings[discordUser.id] }],
        },
      })

      await setSignedCookie(
        c,
        'AUTH',
        JSON.stringify({
          discordName: discordUser.global_name ?? discordUser.username,
          userId: user?.id ?? null,
          userName: user?.name ?? '',
          isStaff: user?.isStaff ?? false,
          isAdmin: user?.isAdmin ?? false,
        } satisfies AuthInfo),
        getenv('COOKIE_SECRET'),
        {
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
        },
      )

      return c.redirect('/')
    },
  )
  .get('signout', (c) => {
    deleteCookie(c, 'AUTH')
    return c.redirect('/')
  })
  .get('api/@me', async (c) => {
    const authInfo = await getAuthInfo(c)
    if (!authInfo) {
      c.status(404)
      return c.json({ error: 'not found' })
    }
    if (!authInfo.userId) {
      return c.json({ discordName: authInfo.discordName, isAdmin: authInfo.isAdmin, isStaff: authInfo.isStaff })
    }
    const prisma: PrismaClient = c.get('prisma')
    const user = await prisma.user.findUnique({
      relationLoadStrategy: 'join',
      where: { id: authInfo.userId },
      include: {
        UserGroup: {
          select: {
            userTitle: true,
            color: true,
          },
        },
      },
    })

    return c.json({ discordName: authInfo.discordName, user, isAdmin: authInfo.isAdmin, isStaff: authInfo.isStaff })
  })

export default app

export interface AuthInfo {
  discordName: string
  userId: number | null
  userName: string
  isAdmin: boolean
  isStaff: boolean
}

export async function getAuthInfo(c: Context): Promise<AuthInfo | null> {
  const cookie = await getSignedCookie(c, getenv('COOKIE_SECRET'), 'AUTH')
  if (!cookie) {
    return null
  }
  return JSON.parse(cookie) as AuthInfo | null
}

function canAccessForum(authInfo: AuthInfo | null, forum: { requiresStaff: boolean; requiresAdmin: boolean }) {
  return (!forum.requiresStaff || authInfo?.isStaff) && (!forum.requiresAdmin || authInfo?.isAdmin)
}

export async function ensureCanAccessForum(c: Context, forumId: number): Promise<AuthInfo | null> {
  const authInfo = await getAuthInfo(c)
  const prisma: PrismaClient = c.get('prisma')
  const forum = await prisma.forum.findUnique({
    select: {
      requiresAdmin: true,
      requiresStaff: true,
    },
    where: {
      id: forumId,
    },
  })

  // We let the route handle the missing entity
  if (forum === null) {
    return authInfo
  }

  if (canAccessForum(authInfo, forum)) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  return authInfo
}

export async function ensureCanAccessTopic(c: Context, topicId: number): Promise<AuthInfo | null> {
  const authInfo = await getAuthInfo(c)
  const prisma: PrismaClient = c.get('prisma')
  const topic = await prisma.topic.findUnique({
    include: {
      Forum: {
        select: {
          requiresAdmin: true,
          requiresStaff: true,
        },
      },
    },
    where: {
      id: topicId,
    },
  })

  // We let the route handle the missing entity
  if (topic === null) {
    return authInfo
  }

  if (canAccessForum(authInfo, topic.Forum)) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  return authInfo
}
