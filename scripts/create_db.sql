-- Before loading into Postgres from MySQL, run these queries on the MySQL db.
--
-- ALTER TABLE `user` MODIFY COLUMN birthday_search DATE NULL;
-- UPDATE `user` SET birthday_search = NULL WHERE birthday_search < '1900-00-00';

--Conversion script based on the Discourse VB5 import script
CREATE TABLE user_group
(
    id         INT PRIMARY KEY,
    title      TEXT NOT NULL,
    user_title TEXT NOT NULL,
    color      TEXT
);

INSERT INTO user_group (id, title, user_title, color)
SELECT usergroupid, title, usertitle, SUBSTRING(opentag FROM '<span style="color:(#?\w+)">')
FROM yc_forum_archive.usergroup;

CREATE TABLE avatar
(
    id               INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id          INT    NOT NULL,
    filename         TEXT   NOT NULL,
    data             BYTEA  NOT NULL,
    width            INT    NOT NULL,
    height           INT    NOT NULL,
    filesize         BIGINT NOT NULL,

    thumbnail_data   BYTEA,
    thumbnail_width  INT    NOT NULL,
    thumbnail_height INT    NOT NULL,

    extension        TEXT   NOT NULL
);

CREATE TABLE "user"
(
    id            INT PRIMARY KEY,
    user_group_id INT  NOT NULL REFERENCES user_group,
    slug          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL UNIQUE,
    email         TEXT UNIQUE,
    title         TEXT,
    title_color   TEXT,
    title_opacity INT,
    created_at    TIMESTAMPTZ,
    post_count    INT  NOT NULL,
    signature     TEXT,
    avatar        INT REFERENCES avatar,

    is_staff BOOLEAN NOT NULL,
    is_admin BOOLEAN NOT NULL,

    --Profile fields
    biography     TEXT,
    location      TEXT,
    interests     TEXT,
    occupation    TEXT,
    in_game_name  TEXT
);

INSERT
INTO avatar (user_id, filename, data, width, height, filesize, thumbnail_data,
             thumbnail_width,
             thumbnail_height, extension)
SELECT ca.userid,
       ca.filename,
       ca.filedata,
       ca.width,
       ca.height,
       ca.filesize,
       ca.filedata_thumb,
       ca.width_thumb,
       ca.height_thumb,
       ca.extension
FROM yc_forum_archive.customavatar ca;
-- The data here is fauly, and will need to be dumped from the live server

INSERT INTO "user" (id, user_group_id, slug, name, email, title, title_color, title_opacity, created_at, post_count,
                    signature, avatar, is_staff, is_admin,
                    biography, location, interests, occupation, in_game_name)
SELECT u.userid,
       u.usergroupid,
       REPLACE((XPATH('/z/text()', ('<z>' || u.username || '</z>')::xml))[1]::TEXT, ' ',
               '-'),                                                    --https://stackoverflow.com/questions/12145634/postgresql-replace-html-entities
       (XPATH('/z/text()', ('<z>' || u.username || '</z>')::xml))[1],
       NULLIF(u.email, ''),
       CASE
           WHEN u.customtitle > 0 THEN CASE
                                           WHEN usertitle ILIKE '%<%' THEN SUBSTRING(usertitle FROM
                                                                                     '<(?:span style=".+"|font color=".+")>([\w ]+)')
                                           ELSE usertitle
                                       END
       END,
       COALESCE(SUBSTRING(usertitle FROM '<span style="color:(#?\w+)">'),
                SUBSTRING(usertitle FROM '<font color="(\w+)">')),
       SUBSTRING(usertitle FROM '<span style="opacity:(\w+).*">')::INT, -- Just for Alex
       TO_TIMESTAMP(u.joindate),
       u.posts,
       ut.signature,
       ua.id,
       FALSE,
       FALSE,
       uf.field1,
       uf.field2,
       uf.field3,
       uf.field4,
       uf.field5
FROM yc_forum_archive.user u
         LEFT JOIN yc_forum_archive.usertextfield ut
                   ON u.userid = ut.userid
         LEFT JOIN yc_forum_archive.userfield uf ON u.userid = uf.userid
         LEFT JOIN avatar ua ON u.userid = ua.user_id;

ALTER TABLE avatar
    DROP
        COLUMN user_id;

CREATE TABLE forum
(
    id           INT PRIMARY KEY,
    parent_id    INT REFERENCES forum,
    slug         TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    displayorder INT  NOT NULL,
    topics_count INT  NOT NULL,
    posts_count  INT  NOT NULL,

    requires_staff BOOLEAN NOT NULL,
    requires_admin BOOLEAN NOT NULL,

    UNIQUE (parent_id, slug),
    UNIQUE (parent_id, title)
);

INSERT INTO forum (id, parent_id, slug, title, description, displayorder, topics_count, posts_count, requires_staff, requires_admin)
VALUES (1, NULL, '', 'Root', 'Root', 1, 0, 0, FALSE, FALSE);

WITH RECURSIVE t(id, requires_staff, requires_admin) AS
                   (SELECT n.nodeid, FALSE, FALSE
                    FROM yc_forum_archive.node n
                    WHERE n.parentid = 1
                      AND n.nodeid != 13 -- Home, unused
                    UNION ALL
                    SELECT
                      n.nodeid,
                      t.requires_staff OR n.nodeid IN (
                        29, -- Ban appeals
                        32 -- Staff sections
                      ),
                      t.requires_admin OR n.nodeid IN (
                        3, -- Blogs
                        8, -- PMs
                        10, -- Reports
                        11, -- Infractions
                        12, -- CSS Examples
                        31 -- Administation
                      )
                    FROM yc_forum_archive.node n
                             JOIN t ON n.parentid = t.id
                    WHERE n.nodeid != 18 --vBCms Comments
                      AND n.contenttypeid = (SELECT contenttypeid
                                             FROM yc_forum_archive.contenttype
                                             WHERE class = 'Channel'))
INSERT
INTO forum (id, parent_id, slug, title, description, displayorder, topics_count, posts_count, requires_staff, requires_admin)
SELECT n.nodeid,
       n.parentid,
       n.urlident,
       n.title,
       n.description,
       n.displayorder,
       0,
       0,
       t.requires_staff,
       t.requires_admin
FROM t
         JOIN yc_forum_archive.node n ON t.id = n.nodeid;

-- Not dealing with content types Gallery (53), Photo(54), Attach(55), Video(56), sigpic
-- Not dealing with post_thanks

-- TODO: Deal with forumpermission, permission
-- TODO: Deal with thread_post. Needed?

CREATE TABLE topic
(
    id         INT PRIMARY KEY,
    forum_id   INT         NOT NULL REFERENCES forum,
    creator_id INT REFERENCES "user",
    created_at TIMESTAMPTZ NOT NULL,
    slug       TEXT        NOT NULL,
    title      TEXT        NOT NULL,
    sticky     BOOLEAN     NOT NULL,
    deleted_at TIMESTAMPTZ,
    hidden     BOOLEAN     NOT NULL,
    post_count INT         NOT NULL
);

CREATE INDEX topics_forum_id_slug_idx ON topic (forum_id, slug);

INSERT INTO topic (id, forum_id, creator_id, created_at, slug, title, sticky, deleted_at, hidden, post_count)
SELECT n.nodeid,
       n.parentid,
       u.userid,
       TO_TIMESTAMP(n.publishdate),
       COALESCE(n.urlident, ''),
       n.title,
       n.sticky,
       TO_TIMESTAMP(NULLIF(n.unpublishdate, 0)),
       n.approved = FALSE OR n.showapproved = FALSE,
       0
FROM yc_forum_archive.node n
         LEFT JOIN yc_forum_archive.user u ON n.userid = u.userid
WHERE n.parentid IN (SELECT id FROM forum)
  AND n.contenttypeid != (SELECT contenttypeid
                          FROM yc_forum_archive.contenttype
                          WHERE class = 'Channel');
CREATE TABLE topic_redirect
(
    topic_id       INT PRIMARY KEY REFERENCES topic,
    redirect_to_id INT NOT NULL REFERENCES topic
);
INSERT INTO topic_redirect (topic_id, redirect_to_id)
SELECT r.nodeid, r.tonodeid
FROM yc_forum_archive.redirect r
         JOIN yc_forum_archive.node fn ON r.nodeid = fn.nodeid
         JOIN yc_forum_archive.node tn ON r.tonodeid = tn.nodeid;


CREATE TABLE tag
(
    id   INT PRIMARY KEY,
    text TEXT NOT NULL
);
INSERT INTO tag (id, text)
SELECT t.tagid, t.tagtext
FROM yc_forum_archive.tag t;

CREATE TABLE topic_tag
(
    topic_id   INT         NOT NULL REFERENCES topic,
    tag_id     INT         NOT NULL REFERENCES tag,
    creator_id INT REFERENCES "user",
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (topic_id, tag_id)
);
INSERT INTO topic_tag (topic_id, tag_id, creator_id, created_at)
SELECT tn.nodeid, tn.tagid, u.id, TO_TIMESTAMP(tn.dateline)
FROM yc_forum_archive.tagnode tn
         LEFT JOIN "user" u ON tn.userid = u.id;

CREATE TABLE post
(
    id         INT PRIMARY KEY,
    topic_id   INT         NOT NULL REFERENCES topic,
    creator_id INT REFERENCES "user",
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    content    TEXT        NOT NULL,
    deleted_at TIMESTAMPTZ,
    hidden     BOOLEAN     NOT NULL,
    ts_vector  TSVECTOR    NOT NULL
);

CREATE INDEX posts_topic_id_idx ON post (topic_id);
CREATE INDEX posts_post_date_idx ON post (created_at);

INSERT INTO post (id, topic_id, creator_id, created_at, updated_at, content, deleted_at, hidden, ts_vector)
SELECT n.nodeid,
       n.nodeid,
       u.id,
       TO_TIMESTAMP(n.publishdate),
       TO_TIMESTAMP(n.lastcontent),
       COALESCE(t.rawtext, ''),
       TO_TIMESTAMP(NULLIF(n.unpublishdate, 0)),
       n.approved = FALSE OR n.showapproved = FALSE,
       TO_TSVECTOR('english', COALESCE(t.rawtext, ''))
FROM yc_forum_archive.node n
         LEFT JOIN yc_forum_archive.text t ON n.nodeid = t.nodeid
         LEFT JOIN "user" u ON n.userid = u.id
WHERE n.nodeid IN (SELECT id FROM topic);

INSERT INTO post (id, topic_id, creator_id, created_at, updated_at, content, deleted_at, hidden, ts_vector)
SELECT n.nodeid,
       n.parentid,
       n.userid,
       TO_TIMESTAMP(n.publishdate),
       TO_TIMESTAMP(n.lastcontent),
       COALESCE(t.rawtext, ''),
       TO_TIMESTAMP(NULLIF(n.unpublishdate, 0)),
       n.approved = FALSE OR n.showapproved = FALSE,
       TO_TSVECTOR('english', COALESCE(t.rawtext, ''))
FROM yc_forum_archive.node n
         LEFT JOIN yc_forum_archive.text t ON n.nodeid = t.nodeid
WHERE n.parentid IN (SELECT id FROM topic);

CREATE TABLE post_edit_history
(
    id         INT PRIMARY KEY,
    post_id    INT         NOT NULL REFERENCES post,
    creator_id INT REFERENCES "user",
    created_at TIMESTAMPTZ NOT NULL,
    reason     TEXT        NOT NULL,
    original   BOOLEAN     NOT NULL,
    text       TEXT        NOT NULL
);
INSERT INTO post_edit_history (id, post_id, creator_id, created_at, reason, original, text)
SELECT peh.postedithistoryid,
       peh.nodeid,
       u.id,
       TO_TIMESTAMP(peh.dateline),
       peh.reason,
       peh.original::INT::BOOLEAN,
       peh.pagetext
FROM yc_forum_archive.postedithistory peh
         JOIN post p ON peh.nodeid = p.id
         LEFT JOIN "user" u ON peh.userid = u.id;

CREATE TABLE post_poll
(
    post_id  INT PRIMARY KEY REFERENCES post,
    multiple BOOLEAN NOT NULL
);
INSERT INTO post_poll (post_id, multiple)
SELECT p.nodeid, p.multiple::BOOLEAN
FROM yc_forum_archive.poll p;

CREATE TABLE post_poll_option
(
    id      INT PRIMARY KEY,
    post_id INT  NOT NULL REFERENCES post_poll,
    title   TEXT NOT NULL
);
INSERT INTO post_poll_option (id, post_id, title)
SELECT po.polloptionid, po.nodeid, po.title
FROM yc_forum_archive.polloption po;

CREATE TABLE post_poll_vote
(
    id             INT PRIMARY KEY,
    poll_option_id INT         NOT NULL REFERENCES post_poll_option,
    user_id        INT         NOT NULL REFERENCES "user",
    created_at     TIMESTAMPTZ NOT NULL
);
INSERT INTO post_poll_vote (id, poll_option_id, user_id, created_at)
SELECT pv.pollvoteid, pv.polloptionid, pv.userid, TO_TIMESTAMP(pv.votedate)
FROM yc_forum_archive.pollvote pv;

CREATE TABLE post_link
(
    post_id   INT PRIMARY KEY REFERENCES post,
    url       TEXT NOT NULL,
    url_title TEXT NOT NULL
);
INSERT INTO post_link (post_id, url, url_title)
SELECT l.nodeid, l.url, l.url_title
FROM yc_forum_archive.link l;

CREATE TABLE smilie
(
    id    INT PRIMARY KEY,
    title TEXT NOT NULL,
    text  TEXT NOT NULL,
    path  TEXT NOT NULL
);
INSERT INTO smilie (id, title, text, path)
SELECT s.smilieid, s.title, s.smilietext, s.smiliepath
FROM yc_forum_archive.smilie s;

UPDATE topic t
SET post_count = (SELECT COUNT(*) FROM post p WHERE p.topic_id = t.id)
WHERE TRUE;

WITH RECURSIVE parents(id, parent_id) AS (SELECT f.id, f.parent_id
                                          FROM forum f
                                          UNION
                                          SELECT f.id, f.id
                                          FROM forum f
                                          UNION
                                          SELECT p.id, f.parent_id
                                          FROM parents p
                                                   JOIN forum f ON p.parent_id = f.id)
UPDATE forum f
SET topics_count = (SELECT COUNT(*)
                    FROM topic t
                             JOIN parents p ON t.forum_id = p.id
                    WHERE p.parent_id = f.id
                      AND NOT t.hidden),
    posts_count  = COALESCE((SELECT SUM(t.post_count)
                             FROM topic t
                                      JOIN parents p ON t.forum_id = p.id
                             WHERE p.parent_id = f.id
                               AND NOT t.hidden), 0)
WHERE TRUE;

CREATE VIEW last_post_in_topic AS
SELECT p.topic_id, MAX(p.id) AS post_id
FROM post p
GROUP BY p.topic_id;
-- SELECT p.topic_id, p.id AS post_id
-- FROM post p
--          JOIN (SELECT p.topic_id, MAX(p.created_at) AS last_posted_at FROM post p GROUP BY p.topic_id) mp
--               ON p.topic_id = mp.topic_id AND p.created_at = mp.last_posted_at;

CREATE MATERIALIZED VIEW post_idx AS
SELECT id, ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY created_at) AS idx
FROM post
WHERE deleted_at IS NULL
  AND NOT hidden;

CREATE VIEW last_edit_for_post AS
SELECT peh.post_id, MAX(peh.id) as post_edit_id
FROM post_edit_history peh
GROUP BY peh.post_id;

CREATE VIEW forum_full_slug AS
WITH RECURSIVE rec(id, url) AS (SELECT id, ARRAY []::TEXT[]
                                FROM forum
                                WHERE parent_id IS NULL
                                UNION ALL
                                SELECT p.id, ARRAY_APPEND(rec.url, p.slug)
                                FROM forum p
                                         JOIN rec ON p.parent_id = rec.id)
SELECT rec.id, rec.url AS slug
FROM rec;