WITH RECURSIVE args(p) AS (VALUES ($1::TEXT[])),
               forum_rec(n, id) AS (SELECT 1, 1
                                    UNION ALL
                                    SELECT r.n + 1, f.id
                                    FROM args,
                                         forum_rec r
                                             JOIN forum f ON f.parent_id = r.id
                                    WHERE (coalesce(ARRAY_LENGTH(args.p, 1), 0) = 0 OR f.slug = args.p[r.n]))
SELECT f.*
FROM forum f
         JOIN forum_rec r ON f.id = r.id WHERE r.id != 1;