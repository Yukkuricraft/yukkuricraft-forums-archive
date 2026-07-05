import { defineEventHandler, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return sendRedirect(event, '/')
})
