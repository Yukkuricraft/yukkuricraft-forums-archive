import { sql } from 'kysely';
function getPostsBaseQuery(kysely, topicId, q) {
    let query = kysely
        .selectFrom('post as p')
        .innerJoin('postIdx as i', 'p.id', 'i.id')
        .leftJoin('lastEditForPost as lefp', 'p.id', 'lefp.postId')
        .leftJoin('postEditHistory as peh', 'lefp.postEditId', 'peh.id')
        .where('p.topicId', '=', topicId);
    if (q) {
        query = query.where((eb) => sql `POSITION(${q} in ${eb.ref('p.content')}) > 0`);
    }
    return query;
}
export function getPostsCountQuery(kysely, topicId, q) {
    return getPostsBaseQuery(kysely, topicId, q).select(kysely.fn.countAll().as('count'));
}
export function getPostsQuery(kysely, topicId, q, limit, offset) {
    return getPostsBaseQuery(kysely, topicId, q)
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
        .orderBy('p.id')
        .limit(limit)
        .offset(offset);
}
function getUserVisitorMessagesBaseQuery(kysely, userId) {
    return kysely
        .selectFrom('postVisitorMessage as pvm')
        .innerJoin('post as p', 'pvm.postId', 'p.id')
        .innerJoin('postIdx as i', 'p.id', 'i.id')
        .leftJoin('lastEditForPost as lefp', 'p.id', 'lefp.postId')
        .leftJoin('postEditHistory as peh', 'lefp.postEditId', 'peh.id')
        .where('pvm.forUser', '=', userId);
}
export function getUserVisitorMessagesCountQuery(kysely, userId) {
    return getUserVisitorMessagesBaseQuery(kysely, userId).select(kysely.fn.countAll().as('count'));
}
export function getUserVisitorMessagesQuery(kysely, userId, limit, offset) {
    return getUserVisitorMessagesBaseQuery(kysely, userId)
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
        .orderBy('p.id desc')
        .limit(limit)
        .offset(offset);
}
