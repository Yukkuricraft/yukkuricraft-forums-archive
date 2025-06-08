SELECT p.id,
       p.topic_id     AS topicId,
       p.creator_id   AS creatorId,
       p.created_at   AS createdAt,
       p.content,
       p.deleted_at   AS deletedAt,
       p.hidden,
       i.idx::INT,
       peh.creator_id AS postEditCreatorId,
       peh.created_at AS postEditCreatedAt,
       peh.reason     AS postEditReason
FROM post p
         JOIN post_idx i ON p.id = i.id
         LEFT JOIN last_edit_for_post lefp ON p.id = lefp.post_id
         LEFT JOIN post_edit_history peh ON lefp.post_edit_id = peh.id
WHERE p.topic_id = $1
  AND ($2 = '' OR POSITION($2 IN content) > 0)
ORDER BY p.id
LIMIT $3 OFFSET $4;