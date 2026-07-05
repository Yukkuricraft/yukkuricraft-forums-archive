import type { SerializeObject } from 'nitropack/types'
import z from 'zod'

export const zOrd = z.enum(['desc', 'asc']).optional()
export const zJson = z.string().transform((s, ctx) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(s)
  } catch {
    ctx.addIssue({
      code: 'invalid_type',
      message: 'Not valid JSON',
      expected: 'object',
      received: 'string',
    })
    return z.NEVER
  }
})

export const searchJsonObj = z.object({
  keywords: z.string().optional(),
  title_only: z.boolean().optional(),
  author: z.array(z.string()).optional(),
  starter_only: z.boolean().optional(),
  date: z
    .object({
      from: z.null().or(z.coerce.date()).optional(),
      to: z.null().or(z.coerce.date()).optional(),
    })
    .optional(),
  sort: z
    .object({
      relevance: zOrd,
      title: zOrd,
      author: zOrd,
      created: zOrd,
      lastcontent: zOrd,
      replies: zOrd,
    })
    .optional(),
  view: z.enum(['default', '', 'topic']).optional(),
  channel: z.array(z.string().pipe(z.coerce.number()).pipe(z.int())).optional(),
})

export const queryParams = z.object({
  q: z.string().optional(),
  p: z.string().pipe(z.coerce.number()).pipe(z.int().min(1)).default(1),
  searchJSON: zJson.pipe(searchJsonObj),
})

export type QueryParams = z.infer<typeof queryParams>

export interface PostSearchRow {
  postId: number
  postCreatorId: number | null
  postCreatedAt: Date
  content: string
  deletedAt: Date | null
  hidden: boolean
  idx: number | null
  topicId: number | null
  topicTitle: string | null
  topicSlug: string | null
  postCount: number | null
  forumId: number | null
  forumSlug: string[] | null
  forumTitle: string | null
  postEditCreatorId: number | null
  postEditCreatedAt: Date | null
  postEditReason: string | null
}

export function makePostOutObj(res: PostSearchRow) {
  return {
    id: res.postId,
    creatorId: res.postCreatorId,
    createdAt: res.postCreatedAt,
    content: res.content,
    deletedAt: res.deletedAt,
    hidden: res.hidden,
    idx: Number(res.idx),
    topic: {
      id: res.topicId,
      title: res.topicTitle,
      slug: res.topicSlug,
      postCount: res.postCount,
      forum: {
        id: res.forumId,
        slug: res.forumSlug,
        title: res.forumTitle,
      },
    },
    edit: (res.postEditCreatorId || res.postEditCreatedAt || res.postEditReason) && {
      creatorId: res.postEditCreatorId,
      createdAt: res.postEditCreatedAt,
      reason: res.postEditReason,
    },
  }
}

export type SearchPost = SerializeObject<ReturnType<typeof makePostOutObj>>

export interface TopicSearchRow {
  topicId: number
  topicCreatorId: number | null
  topicCreatedAt: Date
  topicSlug: string
  topicTitle: string
  postCount: number
  forumId: number | null
  forumTitle: string | null
  forumSlug: string[] | null
  lastPostId: number | null
  lastPostCreatedAt: Date | null
  lastPostCreatorId: number | null
}

export function makeTopicOutObj(res: TopicSearchRow) {
  return {
    id: res.topicId,
    creatorId: res.topicCreatorId,
    createdAt: res.topicCreatedAt,
    slug: res.topicSlug,
    title: res.topicTitle,
    postCount: res.postCount,
    forum: {
      id: res.forumId,
      title: res.forumTitle,
      slug: res.forumSlug,
    },
    lastPost: {
      id: res.lastPostId,
      createdAt: res.lastPostCreatedAt,
      creatorId: res.lastPostCreatorId,
    },
  }
}

export type SearchTopic = SerializeObject<ReturnType<typeof makeTopicOutObj>>
