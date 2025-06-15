import { sql } from 'kysely'
export function getPostsQuery(kysely, topicId, q, limit, offset) {
  let query = kysely
    .selectFrom('post as p')
    .innerJoin('postIdx as i', 'p.id', 'i.id')
    .leftJoin('lastEditForPost as lefp', 'p.id', 'lefp.postId')
    .leftJoin('postEditHistory as peh', 'lefp.postEditId', 'peh.id')
    .where('p.topicId', '=', topicId)
    .select((eb) => [
      'p.id',
      'p.topicId',
      'p.creatorId',
      'p.createdAt',
      'p.updatedAt',
      'p.content',
      'p.deletedAt',
      'p.hidden',
      eb.cast('i.idx', 'integer').as('idx'),
      'peh.creatorId as postEditCreatorId',
      'peh.createdAt as postEditCreatedAt',
      'peh.reason as postEditReason',
    ])
  if (q) {
    query = query.where((eb) => sql`POSITION(${q} in ${eb.ref('p.content')}) > 0)`)
  }
  query = query.orderBy('p.id').limit(limit).offset(offset)
  return query
}
