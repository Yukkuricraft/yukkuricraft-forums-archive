import z from 'zod'

const zOrd = z.enum(['desc', 'asc']).optional()

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
  channel: z.array(z.string()).optional(),
})

export type SearchJsonObj = z.infer<typeof searchJsonObj>