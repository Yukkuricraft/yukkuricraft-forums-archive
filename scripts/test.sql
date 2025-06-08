SELECT *
FROM post p
         JOIN (SELECT p.topic_id, max(p.created_at) as max_created_at FROM post p GROUP BY p.topic_id) pm
              ON p.topic_id = pm.topic_id AND p.created_at = pm.max_created_at;