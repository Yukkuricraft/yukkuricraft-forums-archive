-- Runs against the legacy MySQL database, before pgloader.
--
-- The legacy data contains zero-dates (0000-00-00) in user.birthday_search that
-- strict sql_mode rejects. Clearing sql_mode lets the ALTER keep those values so
-- the following UPDATE can null them out. YEAR(...) < 1900 avoids the invalid
-- '1900-00-00' date literal that strict mode would otherwise reject.
SET SESSION sql_mode = '';

ALTER TABLE `user` MODIFY COLUMN birthday_search DATE NULL;

UPDATE `user` SET birthday_search = NULL
  WHERE birthday_search = '0000-00-00' OR YEAR(birthday_search) < 1900;
