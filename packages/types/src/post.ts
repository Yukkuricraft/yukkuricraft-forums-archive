import type { DB } from '@yukkuricraft-forums-archive/database/kysely'
import { type Kysely, sql, type SelectQueryBuilder, type Simplify } from 'kysely'

function getPostsBaseQuery(kysely: Kysely<DB>, topicId: number, q: string) {
  let query = kysely
    .selectFrom('post as p')
    .innerJoin('postIdx as i', 'p.id', 'i.id')
    .leftJoin('lastEditForPost as lefp', 'p.id', 'lefp.postId')
    .leftJoin('postEditHistory as peh', 'lefp.postEditId', 'peh.id')
    .where('p.topicId', '=', topicId)

  if (q) {
    query = query.where((eb) => sql`POSITION(${q} in ${eb.ref('p.content')}) > 0`)
  }

  return query
}

export function getPostsCountQuery(kysely: Kysely<DB>, topicId: number, q: string) {
  return getPostsBaseQuery(kysely, topicId, q).select(kysely.fn.countAll<bigint>().as('count'))
}

export function getPostsQuery(kysely: Kysely<DB>, topicId: number, q: string, limit: number, offset: number) {
  let query = getPostsBaseQuery(kysely, topicId, q).select((eb) => [
    'p.id',
    'p.topicId',
    'p.creatorId',
    'p.createdAt',
    'p.updatedAt',
    'p.content',
    'p.deletedAt',
    'p.hidden',
    eb.cast<number>('i.idx', 'integer').as('idx'),
    'peh.creatorId as postEditCreatorId',
    'peh.createdAt as postEditCreatedAt',
    'peh.reason as postEditReason',
  ])

  if (q) {
    query = query.where((eb) => sql`POSITION(${q} in ${eb.ref('p.content')}) > 0`)
  }

  query = query.orderBy('p.id').limit(limit).offset(offset)

  return query
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SelectResult<A extends SelectQueryBuilder<any, any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  A extends SelectQueryBuilder<any, any, infer O> ? Simplify<O> : never

export type Post = SelectResult<ReturnType<typeof getPostsQuery>>
