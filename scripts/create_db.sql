--Conversion script based on the Discourse VB5 import script
CREATE EXTENSION mysql_fdw;

CREATE SERVER mysql_forum_data FOREIGN DATA WRAPPER mysql_fdw OPTIONS (host '127.0.0.1', port '3306');

CREATE USER MAPPING FOR CURRENT_USER SERVER mysql_forum_data OPTIONS (username '#username', PASSWORD '#password');

CREATE FOREIGN TABLE f_contenttype (
    contenttypeid BIGINT,
    class BYTEA
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'contenttype');

CREATE FOREIGN TABLE f_node (
    nodeid BIGINT,
    contenttypeid SMALLINT,
    publishdate BIGINT,
    unpublishdate BIGINT,
    userid BIGINT,
    description VARCHAR(1024),
    title VARCHAR(512),
    parentid BIGINT,
    urlident VARCHAR(512),
    displayorder SMALLINT,
    sticky BOOLEAN,
    approved BOOLEAN,
    showapproved BOOLEAN
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'node');

CREATE FOREIGN TABLE f_text (
    nodeid BIGINT,
    rawtext TEXT
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'text');

CREATE FOREIGN TABLE f_user(
    userid BIGINT,
    username TEXT,
    usertitle TEXT,
    joindate BIGINT,
    posts BIGINT
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'user');

CREATE FOREIGN TABLE f_customavatar (
    userid BIGINT,
    filename VARCHAR(100),
    filedata BYTEA
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'customavatar');

CREATE FOREIGN TABLE f_userfield (
    userid BIGINT,
    field1 TEXT,
    field2 TEXT,
    field3 TEXT,
    field4 TEXT,
    field5 TEXT
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'userfield');

CREATE FOREIGN TABLE f_usertextfield (
    userid BIGINT,
    signature TEXT
    ) SERVER mysql_forum_data OPTIONS (dbname '#db_name', TABLE_NAME 'usertextfield');

CREATE TABLE forum (
    id           INT PRIMARY KEY,
    parent_id    INT REFERENCES forum,
    slug         TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    displayorder INT  NOT NULL,
    UNIQUE (parent_id, slug),
    UNIQUE (parent_id, title)
);

INSERT INTO forum (id, parent_id, slug, title, description, displayorder)
SELECT n.nodeid, NULL, n.urlident, n.title, n.description, n.displayorder
    FROM f_node n
    WHERE n.parentid = 2;

--Let's hope everything goes in the right order here. Check if reference checking can be turned off until everything is inserted.
INSERT INTO forum (id, parent_id, slug, title, description, displayorder)
SELECT n.nodeid, n.parentid, n.urlident, n.title, n.description, n.displayorder
    FROM f_node n
    WHERE n.parentid != 2
      AND n.contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Channel');

CREATE TABLE attachments (
    id       BIGSERIAL PRIMARY KEY, --TODO: Use better generated keys
    filename TEXT  NOT NULL,
    data     BYTEA NOT NULL
);

CREATE TABLE users (
    id           INT PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL UNIQUE,
    title        TEXT,
    join_date    TIMESTAMPTZ,
    post_count   INT  NOT NULL,
    signature    TEXT,
    avatar       INT REFERENCES attachments,

    --Profile fields. Should these be included?
    biography    TEXT,
    location     TEXT,
    interests    TEXT,
    occupation   TEXT,
    in_game_name TEXT
);

CREATE TEMPORARY TABLE users_avatars (
    attachment_id INT NOT NULL REFERENCES attachments,
    user_id       INT NOT NULL
);

--TODO: Check if this is still correct
WITH attachments_insert AS (
    INSERT INTO attachments (filename, data)
        SELECT ca.filename, ca.filedata
            FROM f_customavatar ca
        RETURNING id, ca.userid
)
INSERT
    INTO users_avatars (attachment_id, user_id)
SELECT i.id, i.userid
    FROM attachments_insert i;

INSERT INTO users (id, slug, name, title, join_date, post_count, signature, avatar, biography,
                      location, interests, occupation, in_game_name)
SELECT u.userid,
       slugify(u.username),
       u.username,
       u.usertitle,
       u.joindate,
       u.posts,
       ut.signature,
       ua.attachment_id,
       uf.field1,
       uf.field2,
       uf.field3,
       uf.field4,
       uf.field5
    FROM f_user u
             LEFT JOIN f_usertextfield ut ON u.userid = ut.userid
             LEFT JOIN f_userfield uf ON u.userid = uf.userid
             LEFT JOIN users_avatars ua ON u.userid = ua.user_id;

DROP TABLE users_avatars;

CREATE TABLE topics (
    id        INT PRIMARY KEY,
    forum_id  INT         NOT NULL REFERENCES forum,
    poster_id INT         NOT NULL REFERENCES users,
    slug      TEXT        NOT NULL,
    title     TEXT        NOT NULL,
    date      TIMESTAMPTZ NOT NULL,
    sticky    BOOLEAN     NOT NULL
);

CREATE INDEX topics_forum_id_slug_idx ON topics (forum_id, slug);

INSERT INTO topics (id, forum_id, poster_id, slug, title, date, sticky)
SELECT n.nodeid,
       n.parentid,
       n.userid,
       n.urlident,
       n.title,
       n.publishdate,
       n.sticky
    FROM f_node n
    WHERE n.parentid IN (SELECT nodeid
                             FROM f_node
                             WHERE contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Channel'))
      AND n.contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Text')
      AND n.parentid != 7
      AND (n.unpublishdate = 0 OR n.unpublishdate IS NULL)
      AND n.approved = TRUE
      AND n.showapproved = TRUE;

CREATE TABLE posts (
    id        INT PRIMARY KEY,
    topic_id  INT         NOT NULL REFERENCES topics,
    poster_id INT         NOT NULL REFERENCES users,
    content   TEXT        NOT NULL,
    post_date TIMESTAMPTZ NOT NULL,
    edit_date TIMESTAMPTZ
);

CREATE INDEX posts_topic_id_idx ON posts (topic_id);
CREATE INDEX posts_post_date_idx ON posts (post_date);

INSERT INTO posts (id, topic_id, poster_id, content, post_date, edit_date)
SELECT n.nodeid,
       n.parentid,
       n.userid,
       t.rawtext,
       n.publishdate,
       NULL
    FROM f_node n
             LEFT JOIN f_text t ON n.nodeid = t.nodeid
    WHERE n.parentid IN (SELECT nodeid
                             FROM f_node
                             WHERE contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Channel'))
      AND n.contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Text')
      AND n.parentid != 7
      AND (n.unpublishdate = 0 OR n.unpublishdate IS NULL)
      AND n.approved = TRUE
      AND n.showapproved = TRUE;


INSERT INTO posts (id, topic_id, poster_id, content, post_date, edit_date)
SELECT n.nodeid,
       n.parentid,
       n.userid,
       t.rawtext,
       n.publishdate,
       NULL
    FROM f_node n
             LEFT JOIN f_text t ON n.nodeid = t.nodeid
    WHERE n.parentid NOT IN (SELECT nodeid
                                 FROM f_node
                                 WHERE contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Channel'))
      AND n.contenttypeid = (SELECT contenttypeid FROM f_contenttype WHERE class = 'Text')