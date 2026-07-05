import { defineEventHandler, getRouterParam } from 'h3'

import { getForumBySlug } from '#server/utils/forumTree'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  return getForumBySlug(slug.split('/'), event)
})
