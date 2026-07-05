import z from 'zod'

export const sortBySchema = z
  .enum(['dateLastUpdate', 'dateStartedPost', 'replies', 'title', 'members'])
  .default('dateLastUpdate')
export const orderSchema = z.enum(['asc', 'desc']).default('desc')
export const pageSchema = z.coerce.number().pipe(z.int().positive().min(1)).default(1)
export const pageSizeSchema = z.coerce.number().pipe(z.int().positive().max(30).min(1)).default(10)
