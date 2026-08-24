-- Placeholder stand-in for the real vBulletin mysqldump.
--
-- Covers exactly the 18 tables scripts/create_db.sql reads, with enough rows to
-- exercise every INSERT, JOIN and regex in that script: HTML entities in
-- usernames, custom titles with and without markup, a sticky topic, a deleted
-- topic, a hidden topic, a redirect, a poll with votes, a link post, a visitor
-- message, a private message, tags, edit history, and an avatar.
--
-- Restore with:  mysql -h mysql-src -uroot -pmigrate yc_forum_archive < this
SET NAMES utf8mb4;
SET SESSION sql_mode = '';
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS contenttype;
CREATE TABLE contenttype (
  contenttypeid INT NOT NULL,
  class VARCHAR(50) NOT NULL,
  PRIMARY KEY (contenttypeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO contenttype VALUES
  (1,'Channel'),(2,'Text'),(3,'Poll'),(4,'Link'),(5,'PrivateMessage');

DROP TABLE IF EXISTS usergroup;
CREATE TABLE usergroup (
  usergroupid INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  usertitle VARCHAR(100) NOT NULL DEFAULT '',
  opentag VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (usergroupid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO usergroup VALUES
  (2,'Registered Users','Member',''),
  (6,'Administrators','Administrator','<span style="color:#e56a00">'),
  (7,'Moderators','Moderator','<span style="color:green">');

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  userid INT NOT NULL,
  usergroupid INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL DEFAULT '',
  customtitle SMALLINT NOT NULL DEFAULT 0,
  usertitle VARCHAR(255) NOT NULL DEFAULT '',
  joindate INT UNSIGNED NOT NULL DEFAULT 0,
  posts INT UNSIGNED NOT NULL DEFAULT 0,
  birthday_search DATE NOT NULL DEFAULT '0000-00-00',
  PRIMARY KEY (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Alice: custom title wrapped in markup, exercises the colour regex. No row
-- carries an `opacity:` style, so title_opacity is NULL throughout — that is
-- the expected no-match path for that SUBSTRING, not an oversight.
-- Bob Smith: space in name, exercises the slug REPLACE.
-- Carol &amp; Dave: HTML entity, exercises the `<z>` XPATH wrapper round-trip.
-- That round-trip RE-ESCAPES entities (bare & is illegal in XML character
-- data) — it does not decode them. `&amp;` is expected to stay escaped all
-- the way through create_db.sql; this app decodes entities in the view
-- layer instead (app/util/htmlEntities.ts), not in SQL.
-- birthday_search values cover both branches of mysql_prepare.sql.
INSERT INTO `user` VALUES
  (1,6,'Alice','alice@example.com',1,'<span style="color:#ff0000">Overlord</span>',1300000000,42,'0000-00-00'),
  (2,2,'Bob Smith','bob@example.com',0,'Member',1310000000,7,'1850-03-04'),
  (3,7,'Carol &amp; Dave','',1,'Moderator',1320000000,15,'1990-06-15');

DROP TABLE IF EXISTS usertextfield;
CREATE TABLE usertextfield (
  userid INT NOT NULL,
  signature TEXT,
  PRIMARY KEY (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO usertextfield VALUES
  (1,'[b]Alice[/b] — admin'),
  (2,NULL),
  (3,'Moderator signature');

DROP TABLE IF EXISTS userfield;
CREATE TABLE userfield (
  userid INT NOT NULL,
  field1 TEXT, field2 TEXT, field3 TEXT, field4 TEXT, field5 TEXT,
  PRIMARY KEY (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- field1..5 map to biography, location, interests, occupation, in_game_name.
INSERT INTO userfield VALUES
  (1,'Runs the server.','Tokyo','Redstone','Sysadmin','alice_mc'),
  (2,'Just visiting.','Berlin',NULL,NULL,'bobbo'),
  (3,NULL,NULL,NULL,NULL,'carol_d');

DROP TABLE IF EXISTS customavatar;
CREATE TABLE customavatar (
  userid INT NOT NULL,
  filename VARCHAR(100) NOT NULL DEFAULT '',
  filedata MEDIUMBLOB NOT NULL,
  width SMALLINT NOT NULL DEFAULT 0,
  height SMALLINT NOT NULL DEFAULT 0,
  filesize INT NOT NULL DEFAULT 0,
  filedata_thumb MEDIUMBLOB,
  width_thumb SMALLINT NOT NULL DEFAULT 0,
  height_thumb SMALLINT NOT NULL DEFAULT 0,
  extension VARCHAR(20) NOT NULL DEFAULT 'png',
  PRIMARY KEY (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- An 8-byte PNG signature is enough; nothing renders it during migration.
INSERT INTO customavatar VALUES
  (1,'alice.png',0x89504E470D0A1A0A,64,64,8,0x89504E470D0A1A0A,32,32,'png');

DROP TABLE IF EXISTS node;
CREATE TABLE node (
  nodeid INT NOT NULL,
  parentid INT NOT NULL DEFAULT 0,
  contenttypeid INT NOT NULL,
  urlident VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  displayorder INT NOT NULL DEFAULT 0,
  publishdate INT UNSIGNED NOT NULL DEFAULT 0,
  unpublishdate INT UNSIGNED NOT NULL DEFAULT 0,
  sticky TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  approved TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  showapproved TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  userid INT UNSIGNED NOT NULL DEFAULT 0,
  lastcontent INT UNSIGNED NOT NULL DEFAULT 0,
  setfor INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (nodeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Forums (Channels). 13 is excluded by name in create_db.sql; it is here to
-- prove that exclusion works.
INSERT INTO node VALUES
  (2, 1,1,'general','General Discussion','Everything else.',1,1300000000,0,0,1,1,1,1300000000,0),
  (3, 2,1,'announcements','Announcements','Server news.',       1,1300000000,0,0,1,1,1,1300000000,0),
  (13,1,1,'home','Home','Unused vBulletin home node.',          9,1300000000,0,0,1,1,1,1300000000,0);
-- Topics (parent is a forum, content type is not Channel).
INSERT INTO node VALUES
  (100,2,2,'welcome-thread','Welcome Thread',NULL,0,1400000000,0,1,1,1,1,1400002000,0),
  (103,3,2,'server-rules','Server Rules',NULL,   0,1400001000,0,0,1,1,1,1400001500,0),
  (104,2,2,'old-thread','Old Thread (moved)',NULL,0,1400003000,0,0,1,1,2,1400003000,0),
  (105,2,3,'favorite-biome','Favorite Biome',NULL,0,1400004000,0,0,1,1,3,1400004000,0),
  (108,2,2,'deleted-thread','Deleted Thread',NULL,0,1400005000,1400009000,0,1,1,1,1400005000,0),
  (109,2,2,'hidden-thread','Hidden Thread',NULL,  0,1400006000,0,0,0,1,2,1400006000,0),
  (110,2,5,'pm-thread','A Private Message',NULL,  0,1400007000,0,0,1,1,1,1400007000,0);
-- Replies (parent is a topic). Two traps here:
--  * Every userid must exist in `user`: create_db.sql inserts these without a
--    LEFT JOIN, straight into an FK column.
--  * unpublishdate must be 0. create_db.sql maps it to deleted_at via
--    NULLIF(n.unpublishdate, 0), so any non-zero value silently soft-deletes
--    the post and drops it out of post_count, member_count, last_post_in_topic
--    and post_idx. Only node 108 is meant to be deleted.
INSERT INTO node VALUES
  (101,100,2,NULL,'Re: Welcome Thread',NULL,0,1400001000,0,0,1,1,2,1400001000,0),
  (102,100,2,NULL,'Re: Welcome Thread',NULL,0,1400002000,0,0,1,1,3,1400002000,0),
  (106,100,4,NULL,'Useful link',NULL,       0,1400002500,0,0,1,1,2,1400002500,0),
  (107,103,2,NULL,'Visitor message',NULL,   0,1400002800,0,0,1,1,3,1400002800,2);

DROP TABLE IF EXISTS text;
CREATE TABLE text (
  nodeid INT NOT NULL,
  rawtext MEDIUMTEXT,
  PRIMARY KEY (nodeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO text VALUES
  (100,'Welcome to the archive! [b]Read the rules.[/b]'),
  (101,'Thanks for having me.'),
  (102,'Glad to be here :)'),
  (103,'1. Be nice.\n2. No griefing.'),
  (104,'This thread moved.'),
  (105,'Vote for your favourite biome.'),
  (106,'Check this out.'),
  (107,'Hi Bob, welcome aboard.'),
  (108,'This post was deleted.'),
  (109,'This post is awaiting moderation.'),
  (110,'A private message body.');

DROP TABLE IF EXISTS redirect;
CREATE TABLE redirect (
  nodeid INT NOT NULL,
  tonodeid INT NOT NULL,
  PRIMARY KEY (nodeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO redirect VALUES (104,100);

DROP TABLE IF EXISTS tag;
CREATE TABLE tag (
  tagid INT NOT NULL,
  tagtext VARCHAR(100) NOT NULL,
  PRIMARY KEY (tagid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO tag VALUES (1,'minecraft'),(2,'announcement');

DROP TABLE IF EXISTS tagnode;
CREATE TABLE tagnode (
  nodeid INT NOT NULL,
  tagid INT NOT NULL,
  userid INT NOT NULL DEFAULT 0,
  dateline INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (nodeid,tagid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO tagnode VALUES (100,1,1,1400001100),(103,2,1,1400001200);

DROP TABLE IF EXISTS postedithistory;
CREATE TABLE postedithistory (
  postedithistoryid INT NOT NULL,
  nodeid INT NOT NULL,
  userid INT NOT NULL DEFAULT 0,
  dateline INT UNSIGNED NOT NULL DEFAULT 0,
  reason VARCHAR(255) NOT NULL DEFAULT '',
  original TINYINT UNSIGNED NOT NULL DEFAULT 0,
  pagetext MEDIUMTEXT,
  PRIMARY KEY (postedithistoryid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO postedithistory VALUES
  (1,100,1,1400000500,'',1,'Welcome to the archive!'),
  (2,100,1,1400000900,'typo',0,'Welcome to the archive! [b]Read the rules.[/b]');

DROP TABLE IF EXISTS poll;
CREATE TABLE poll (
  nodeid INT NOT NULL,
  multiple TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (nodeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO poll VALUES (105,0);

DROP TABLE IF EXISTS polloption;
CREATE TABLE polloption (
  polloptionid INT NOT NULL,
  nodeid INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  PRIMARY KEY (polloptionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO polloption VALUES (1,105,'Forest'),(2,105,'Desert');

DROP TABLE IF EXISTS pollvote;
CREATE TABLE pollvote (
  pollvoteid INT NOT NULL,
  polloptionid INT NOT NULL,
  userid INT NOT NULL,
  votedate INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (pollvoteid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO pollvote VALUES (1,1,1,1400004100),(2,2,2,1400004200);

DROP TABLE IF EXISTS link;
CREATE TABLE link (
  nodeid INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  url_title VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (nodeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO link VALUES (106,'https://example.com/','Example');

DROP TABLE IF EXISTS sentto;
CREATE TABLE sentto (
  nodeid INT NOT NULL,
  userid INT NOT NULL,
  PRIMARY KEY (nodeid,userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO sentto VALUES (110,2),(110,3);

DROP TABLE IF EXISTS smilie;
CREATE TABLE smilie (
  smilieid INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  smilietext VARCHAR(50) NOT NULL,
  smiliepath VARCHAR(255) NOT NULL,
  PRIMARY KEY (smilieid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO smilie VALUES
  (1,'Smile',':)','images/smilies/smile.png'),
  (2,'Frown',':(','images/smilies/frown.png');

SET FOREIGN_KEY_CHECKS = 1;
