BEGIN;

DELETE FROM tags
WHERE slug = 'permission-probe';

INSERT INTO tags (slug, name)
VALUES ('permission-probe', 'Permission probe');

UPDATE tags
SET name = 'Updated permission probe'
WHERE slug = 'permission-probe';

DO $$
DECLARE
  matching_tags integer;
BEGIN
  SELECT count(*)
  INTO matching_tags
  FROM tags
  WHERE slug = 'permission-probe'
    AND name = 'Updated permission probe';

  IF matching_tags <> 1 THEN
    RAISE EXCEPTION 'Expected application-role DML to affect one tag';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE TABLE public.permission_probe_table (id integer)';
    RAISE EXCEPTION 'Application role unexpectedly created a table';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE 'SELECT count(*) FROM drizzle.__drizzle_migrations';
    RAISE EXCEPTION 'Application role unexpectedly read the migration ledger';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;

DELETE FROM tags
WHERE slug = 'permission-probe';

ROLLBACK;
