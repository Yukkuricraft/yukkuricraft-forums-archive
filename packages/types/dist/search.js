import { sql } from 'kysely';
import z from 'zod';
export const zOrd = z.enum(['desc', 'asc']).optional();
export const zJson = z.string().transform((s, ctx) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(s);
    }
    catch (e) {
        ctx.addIssue({
            code: 'invalid_type',
            message: 'Not valid JSON',
            expected: 'object',
            received: 'string',
        });
        return z.NEVER;
    }
});
export const searchJsonObj = z.object({
    keywords: z.string().optional(),
    title_only: z.boolean().optional(),
    author: z.array(z.string()).optional(),
    starter_only: z.boolean().optional(),
    date: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(),
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
});
export const queryParams = z.object({
    q: z.string().optional(),
    p: z.string().pipe(z.coerce.number()).pipe(z.int().min(1)).default(1),
    searchJSON: zJson.pipe(searchJsonObj),
});
export function postQuery(kysely, params) {
    const { q, searchJSON: { keywords, author, date, channel }, } = params;
    let query = kysely
        .selectFrom('post as p')
        .leftJoin('postIdx as pi', 'p.id', 'pi.id')
        .leftJoin('user as u', 'p.creatorId', 'u.id')
        .leftJoin('topic as t', 'p.topicId', 't.id')
        .leftJoin('forum as f', 't.forumId', 'f.id')
        .leftJoin('forumFullSlug as fs', 'f.id', 'fs.id')
        .leftJoin('lastEditForPost as lefp', 'p.id', 'lefp.postId')
        .leftJoin('postEditHistory as peh', 'peh.id', 'lefp.postEditId');
    query = query.where('p.deletedAt', 'is', null).where('p.hidden', '=', false);
    if (keywords || q) {
        query = query.where((eb) => eb(sql.ref('p.ts_vector'), '@@', eb.fn('websearch_to_tsquery', [sql.lit('english'), eb.val(keywords ?? q ?? '')])));
    }
    if (date?.to) {
        query = query.where('p.createdAt', '<=', date.to);
    }
    if (date?.from) {
        query = query.where('p.createdAt', '>=', date.from);
    }
    if (author) {
        query = query.where('u.name', 'in', author);
    }
    if (channel) {
        query = query.where('t.forumId', 'in', channel);
    }
    return query;
}
export function postSelectQuery(kysely, params) {
    return postQuery(kysely, params)
        .select([
        'p.id as postId',
        'p.creatorId as postCreatorId',
        'p.createdAt as postCreatedAt',
        'p.content as content',
        'p.deletedAt as deletedAt',
        'p.hidden as hidden',
        'pi.idx as idx',
        't.id as topicId',
        't.title as topicTitle',
        't.slug as topicSlug',
        't.postCount as postCount',
        'f.id as forumId',
        'fs.slug as forumSlug',
        'f.title as forumTitle',
        'peh.creatorId as postEditCreatorId',
        'peh.createdAt as postEditCreatedAt',
        'peh.reason as postEditReason',
    ])
        .select((eb) => eb
        .fn('TS_RANK_CD', [
        sql.ref('p.ts_vector'),
        eb.fn('websearch_to_tsquery', [sql.lit('english'), eb.val(params.searchJSON.keywords ?? params.q ?? '')]),
    ])
        .as('rank'));
}
export function makePostOutObj(res) {
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
    };
}
export function topicQuery(kysely, params) {
    const { q, searchJSON: { keywords, author, date, channel }, } = params;
    let query = kysely
        .selectFrom('topic as t')
        .leftJoin('user as u', 't.creatorId', 'u.id')
        .leftJoin('forum as f', 't.forumId', 'f.id')
        .leftJoin('forumFullSlug as fs', 'f.id', 'fs.id')
        .leftJoin('lastPostInTopic as lpt', 't.id', 'lpt.topicId')
        .leftJoin('post as p', 'lpt.postId', 'p.id');
    if (keywords || q) {
        // Technically vBulletin searches all posts in a topic here I think, but that's a bit much
        query = query.where((eb) => eb(sql.ref('t.ts_vector'), '@@', eb.fn('websearch_to_tsquery', [sql.lit('english'), eb.val(keywords ?? q ?? '')])));
    }
    query = query.where('t.deletedAt', 'is', null).where('t.hidden', '=', false);
    if (date?.to) {
        query = query.where('t.createdAt', '<=', date.to);
    }
    if (date?.from) {
        query = query.where('t.createdAt', '>=', date.from);
    }
    if (author) {
        query = query.where('u.name', 'in', author);
    }
    if (channel) {
        query = query.where('t.forumId', 'in', channel);
    }
    return query;
}
export function topicSelectQuery(kysely, params) {
    return topicQuery(kysely, params)
        .select([
        't.id as topicId',
        't.creatorId as topicCreatorId',
        't.createdAt as topicCreatedAt',
        't.slug as topicSlug',
        't.title as topicTitle',
        't.postCount as postCount',
        'f.id as forumId',
        'f.title as forumTitle',
        'fs.slug as forumSlug',
        'p.id as lastPostId',
        'p.createdAt as lastPostCreatedAt',
        'p.creatorId as lastPostCreatorId',
    ])
        .select((eb) => eb
        .fn('TS_RANK_CD', [
        sql.ref('t.ts_vector'),
        eb.fn('websearch_to_tsquery', [sql.lit('english'), eb.val(params.searchJSON.keywords ?? params.q ?? '')]),
    ])
        .as('rank'));
}
export function makeTopicOutObj(res) {
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
    };
}
