import { defineEventHandler, getValidatedQuery, sendRedirect } from 'h3'
import z from 'zod'

export default defineEventHandler(async (event) => {
  const { userId, thumb } = await getValidatedQuery(
    event,
    z.object({
      userId: z.string(),
      thumb: z.string().pipe(z.coerce.number()).optional(),
    }).parse,
  )
  return sendRedirect(event, `/api/user/${userId}/avatar${thumb === 1 ? '/thumbnail' : ''}`)
})
