import { sql } from 'kysely';
export function getForumsBySlugQuery(kysely, slug, { isAdmin, isStaff }) {
    return kysely
        .withRecursive('args(p2)', (db) => db.selectNoFrom((eb) => sql `${eb.parens(eb.val(slug))}::TEXT[]`.as('p2')))
        .withRecursive('forum_rec(n, id)', (db) => db
        .selectNoFrom((eb) => [eb.lit(1).as('n'), eb.lit(1).as('id')])
        .unionAll(db
        .selectFrom('args')
        .crossJoin('forum_rec as r')
        .innerJoin('forum as f', 'f.parentId', 'r.id')
        .where((eb) => eb.or([
        eb(eb.fn.coalesce(eb.fn('ARRAY_LENGTH', ['args.p2', eb.lit(1)]), eb.lit(0)), '=', eb.lit(0)),
        eb('f.slug', '=', sql `${eb.ref('args.p2')}[${eb.ref('r.n')}]`),
    ]))
        .select((eb) => [eb('r.n', '+', eb.lit(1)).as('n'), 'f.id'])))
        .selectFrom('forum as f')
        .innerJoin('forum_rec as r', 'f.id', 'r.id')
        .where((eb) => eb('r.id', '!=', eb.lit(1)))
        .where((eb) => (isAdmin ? eb.lit(true) : eb('f.requiresAdmin', '=', eb.lit(false))))
        .where((eb) => (isStaff ? eb.lit(true) : eb('f.requiresStaff', '=', eb.lit(false))))
        .selectAll('f');
}
