import { defineEventHandler } from 'h3'

import { getForumBySlug } from '#server/utils/forumTree'

export default defineEventHandler((event) => getForumBySlug([], event))
