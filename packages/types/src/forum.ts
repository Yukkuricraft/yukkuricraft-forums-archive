import type { Forum } from '@yukkuricraft-forums-archive/database'
import type { DB } from '@yukkuricraft-forums-archive/database/kysely'
import { type Kysely, sql } from 'kysely'

export interface ForumTree extends Forum {
  subForums: ForumTree[]
}

export function getForumsBySlugQuery(kysely: Kysely<DB>, slug: string[]) {
  return kysely
    .withRecursive('args(p2)', (db) =>
      db.selectNoFrom((eb) => sql<string[]>`${eb.parens(eb.val(slug))}::TEXT[]`.as('p2')),
    )
    .withRecursive('forum_rec(n, id)', (db) =>
      db
        .selectNoFrom((eb) => [eb.lit<number>(1).as('n'), eb.lit<number>(1).as('id')])
        .unionAll(
          db
            .selectFrom('args')
            .crossJoin('forum_rec as r')
            .innerJoin('forum as f', 'f.parentId', 'r.id')
            .where((eb) =>
              eb.or([
                eb(eb.fn.coalesce(eb.fn('ARRAY_LENGTH', ['args.p2', eb.lit(1)]), eb.lit(0)), '=', eb.lit(0)),
                eb('f.slug', '=', sql<string>`${eb.ref('args.p2')}[${eb.ref('r.n')}]`),
              ]),
            )
            .select((eb) => [eb('r.n', '+', eb.lit(1)).as('n'), 'f.id']),
        ),
    )
    .selectFrom('forum as f')
    .innerJoin('forum_rec as r', 'f.id', 'r.id')
    .where((eb) => eb('r.id', '!=', eb.lit(1)))
    .selectAll('f')
}
