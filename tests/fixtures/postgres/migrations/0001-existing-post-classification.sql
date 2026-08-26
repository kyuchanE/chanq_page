INSERT INTO posts (
  id,
  slug,
  title,
  summary,
  body,
  status,
  published_at,
  seo_title,
  seo_description,
  og_image_path,
  created_at,
  updated_at
)
VALUES
  (
    '94000000-0000-4000-8000-000000000001',
    'migration-probe-published-post',
    'Published migration probe',
    'Representative published content that predates post classification.',
    '# Published migration probe',
    'published',
    '2025-04-05T06:07:08Z',
    'Published migration probe',
    'Representative published content for upgrade validation.',
    '/images/migration-probe.png',
    '2025-01-02T03:04:05Z',
    '2025-02-03T04:05:06Z'
  ),
  (
    '94000000-0000-4000-8000-000000000002',
    'migration-probe-draft-post',
    'Draft migration probe',
    'Representative draft content that predates post classification.',
    '# Draft migration probe',
    'draft',
    NULL,
    'Draft migration probe',
    'Representative draft content for upgrade validation.',
    NULL,
    '2025-05-06T07:08:09Z',
    '2025-06-07T08:09:10Z'
  );
