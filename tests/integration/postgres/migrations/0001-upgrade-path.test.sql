DO $$
DECLARE
  preserved_count integer;
  kind_default text;
  kind_nullable text;
BEGIN
  SELECT count(*)
  INTO preserved_count
  FROM posts
  WHERE (
    id = '94000000-0000-4000-8000-000000000001'
    AND slug = 'migration-probe-published-post'
    AND kind = 'article'
    AND status = 'published'
    AND published_at = '2025-04-05T06:07:08Z'
    AND created_at = '2025-01-02T03:04:05Z'
    AND updated_at = '2025-02-03T04:05:06Z'
  ) OR (
    id = '94000000-0000-4000-8000-000000000002'
    AND slug = 'migration-probe-draft-post'
    AND kind = 'article'
    AND status = 'draft'
    AND published_at IS NULL
    AND created_at = '2025-05-06T07:08:09Z'
    AND updated_at = '2025-06-07T08:09:10Z'
  );

  IF preserved_count <> 2 THEN
    RAISE EXCEPTION 'Post classification upgrade did not preserve representative rows';
  END IF;

  SELECT column_default, is_nullable
  INTO kind_default, kind_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'posts'
    AND column_name = 'kind';

  IF kind_nullable <> 'NO' OR kind_default IS NOT NULL THEN
    RAISE EXCEPTION 'Post classification upgrade left an implicit kind default';
  END IF;
END $$;
