BEGIN;

DO $$
BEGIN
  IF current_database() <> 'chanq_page' THEN
    RAISE EXCEPTION 'Development seed refused database %', current_database();
  END IF;

  IF current_user <> 'chanq_page_app' THEN
    RAISE EXCEPTION 'Development seed requires chanq_page_app, received %', current_user;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM projects
    WHERE id IN (
      '11000000-0000-4000-8000-000000000001'::uuid,
      '11000000-0000-4000-8000-000000000002'::uuid
    )
      AND slug NOT LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1
    FROM posts
    WHERE id IN (
      '12000000-0000-4000-8000-000000000001'::uuid,
      '12000000-0000-4000-8000-000000000002'::uuid
    )
      AND slug NOT LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1
    FROM skills
    WHERE id IN (
      '10000000-0000-4000-8000-000000000001'::uuid,
      '10000000-0000-4000-8000-000000000002'::uuid,
      '10000000-0000-4000-8000-000000000003'::uuid
    )
      AND key NOT LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1
    FROM tags
    WHERE id IN (
      '13000000-0000-4000-8000-000000000001'::uuid,
      '13000000-0000-4000-8000-000000000002'::uuid
    )
      AND slug NOT LIKE 'dev-seed-%'
  ) THEN
    RAISE EXCEPTION 'A development fixture UUID is already owned by non-fixture data';
  END IF;
END $$;

-- The dev-seed- prefix is reserved for rows owned by this fixture. Removing a
-- fixture from this file prunes only stale rows in that reserved namespace.
DELETE FROM posts
WHERE slug LIKE 'dev-seed-%'
  AND id NOT IN (
    '12000000-0000-4000-8000-000000000001'::uuid,
    '12000000-0000-4000-8000-000000000002'::uuid
  );

DELETE FROM projects
WHERE slug LIKE 'dev-seed-%'
  AND id NOT IN (
    '11000000-0000-4000-8000-000000000001'::uuid,
    '11000000-0000-4000-8000-000000000002'::uuid
  );

DELETE FROM skills
WHERE key LIKE 'dev-seed-%'
  AND id NOT IN (
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid
  );

DELETE FROM tags
WHERE slug LIKE 'dev-seed-%'
  AND id NOT IN (
    '13000000-0000-4000-8000-000000000001'::uuid,
    '13000000-0000-4000-8000-000000000002'::uuid
  );

INSERT INTO skills (
  id,
  key,
  name,
  category,
  summary,
  evidence,
  display_order,
  visible,
  created_at,
  updated_at
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'dev-seed-typescript',
    'TypeScript',
    'Frontend',
    'Synthetic development data for type-safe application flows.',
    'Used by deterministic local fixtures only.',
    1,
    true,
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'dev-seed-nextjs',
    'Next.js',
    'Frontend',
    'Synthetic development data for server-rendered portfolio routes.',
    'Used by deterministic local fixtures only.',
    2,
    true,
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'dev-seed-postgresql',
    'PostgreSQL',
    'Database',
    'Synthetic development data for relational content behavior.',
    'Used by deterministic local fixtures only.',
    3,
    true,
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  key = excluded.key,
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  evidence = excluded.evidence,
  display_order = excluded.display_order,
  visible = excluded.visible,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

INSERT INTO projects (
  id,
  slug,
  title,
  summary,
  body,
  status,
  featured,
  display_order,
  published_at,
  seo_title,
  seo_description,
  og_image_path,
  repository_url,
  live_url,
  created_at,
  updated_at
)
VALUES
  (
    '11000000-0000-4000-8000-000000000001',
    'dev-seed-portfolio-foundation',
    'Development Seed Portfolio Foundation',
    'Synthetic published project used to exercise local portfolio reads.',
    E'# Development Seed Portfolio Foundation\n\nSynthetic development content with no production claims.',
    'published',
    true,
    1,
    '2026-01-15T00:00:00Z',
    'Development Seed Portfolio Foundation',
    'Synthetic published project for deterministic local development.',
    NULL,
    NULL,
    NULL,
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    'dev-seed-draft-project',
    'Development Seed Draft Project',
    'Synthetic draft project used to verify publication filtering.',
    E'# Development Seed Draft Project\n\nThis fixture must remain unpublished.',
    'draft',
    false,
    2,
    NULL,
    'Development Seed Draft Project',
    'Synthetic draft project for deterministic local development.',
    NULL,
    NULL,
    NULL,
    '2026-01-02T00:00:00Z',
    '2026-01-02T00:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  status = excluded.status,
  featured = excluded.featured,
  display_order = excluded.display_order,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_image_path = excluded.og_image_path,
  repository_url = excluded.repository_url,
  live_url = excluded.live_url,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

INSERT INTO posts (
  id,
  slug,
  title,
  summary,
  body,
  kind,
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
    '12000000-0000-4000-8000-000000000001',
    'dev-seed-deterministic-postgresql-data',
    'Development Seed Deterministic PostgreSQL Data',
    'Synthetic published post used to exercise deterministic relations.',
    E'# Development Seed Deterministic PostgreSQL Data\n\nSynthetic development content with fixed identifiers and timestamps.',
    'article',
    'published',
    '2026-01-20T00:00:00Z',
    'Development Seed Deterministic PostgreSQL Data',
    'Synthetic post for deterministic local development.',
    NULL,
    '2026-01-03T00:00:00Z',
    '2026-01-03T00:00:00Z'
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    'dev-seed-draft-post',
    'Development Seed Draft Post',
    'Synthetic draft post used to verify publication filtering.',
    E'# Development Seed Draft Post\n\nThis fixture must remain unpublished.',
    'retrospective',
    'draft',
    NULL,
    'Development Seed Draft Post',
    'Synthetic draft post for deterministic local development.',
    NULL,
    '2026-01-04T00:00:00Z',
    '2026-01-04T00:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  kind = excluded.kind,
  status = excluded.status,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_image_path = excluded.og_image_path,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

INSERT INTO tags (id, slug, name, created_at, updated_at)
VALUES
  (
    '13000000-0000-4000-8000-000000000001',
    'dev-seed-database',
    'Database',
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    'dev-seed-architecture',
    'Architecture',
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

DELETE FROM project_skills
WHERE project_id IN (
  '11000000-0000-4000-8000-000000000001'::uuid,
  '11000000-0000-4000-8000-000000000002'::uuid
);

DELETE FROM post_tags
WHERE post_id IN (
  '12000000-0000-4000-8000-000000000001'::uuid,
  '12000000-0000-4000-8000-000000000002'::uuid
);

DELETE FROM post_projects
WHERE post_id IN (
  '12000000-0000-4000-8000-000000000001'::uuid,
  '12000000-0000-4000-8000-000000000002'::uuid
);

INSERT INTO project_skills (project_id, skill_id)
VALUES
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003'),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002');

INSERT INTO post_tags (post_id, tag_id)
VALUES
  ('12000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000002'),
  ('12000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000002');

INSERT INTO post_projects (post_id, project_id)
VALUES
  ('12000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002');

COMMIT;
