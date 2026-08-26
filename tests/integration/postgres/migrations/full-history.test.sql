DO $$
DECLARE
  kind_default text;
  kind_nullable text;
BEGIN
  SELECT column_default, is_nullable
  INTO kind_default, kind_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'posts'
    AND column_name = 'kind';

  IF kind_nullable <> 'NO' OR kind_default IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh migration history did not create an explicit required post kind';
  END IF;

  IF enum_range(NULL::post_kind)::text <> '{article,retrospective}' THEN
    RAISE EXCEPTION 'Fresh migration history created unexpected post kinds';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND indexname = 'posts_kind_published_listing_index'
      AND indexdef LIKE '%(kind, status, published_at)%'
  ) OR EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND indexname = 'posts_published_listing_index'
  ) THEN
    RAISE EXCEPTION 'Fresh migration history did not create the section-aware post index';
  END IF;
END $$;

INSERT INTO posts (
  slug,
  title,
  summary,
  body,
  kind,
  status,
  published_at,
  seo_title,
  seo_description
)
VALUES
  (
    'migration-fresh-article',
    'Fresh article',
    'Fresh article migration probe.',
    '# Fresh article',
    'article',
    'published',
    '2025-07-01T00:00:00Z',
    'Fresh article',
    'Fresh article migration probe.'
  ),
  (
    'migration-fresh-retrospective',
    'Fresh retrospective',
    'Fresh retrospective migration probe.',
    '# Fresh retrospective',
    'retrospective',
    'published',
    '2025-07-02T00:00:00Z',
    'Fresh retrospective',
    'Fresh retrospective migration probe.'
  );

DO $$
DECLARE
  classified_kinds text[];
BEGIN
  SELECT array_agg(kind::text ORDER BY kind::text)
  INTO classified_kinds
  FROM posts
  WHERE status = 'published';

  IF classified_kinds <> ARRAY['article', 'retrospective'] THEN
    RAISE EXCEPTION 'Fresh classification query returned %', classified_kinds;
  END IF;

  BEGIN
    INSERT INTO posts (
      slug,
      title,
      summary,
      body,
      status,
      seo_title,
      seo_description
    )
    VALUES (
      'migration-missing-kind',
      'Missing kind',
      'This insert must fail.',
      '# Missing kind',
      'draft',
      'Missing kind',
      'Missing kind migration probe.'
    );

    RAISE EXCEPTION 'Post without an explicit kind was accepted';
  EXCEPTION
    WHEN not_null_violation THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE posts SET kind = ''essay'' WHERE slug = ''migration-fresh-article''';
    RAISE EXCEPTION 'Unsupported post kind was accepted';
  EXCEPTION
    WHEN invalid_text_representation THEN NULL;
  END;
END $$;
