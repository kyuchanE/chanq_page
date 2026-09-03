BEGIN;

DO $$
BEGIN
  IF current_database() <> 'chanq_page_test' THEN
    RAISE EXCEPTION 'Test fixture reset refused database %', current_database();
  END IF;

  IF current_user <> 'chanq_page_test_app' THEN
    RAISE EXCEPTION 'Test fixture reset requires chanq_page_test_app, received %', current_user;
  END IF;
END $$;

DELETE FROM post_tags;
DELETE FROM post_projects;
DELETE FROM project_skills;
DELETE FROM posts;
DELETE FROM projects;
DELETE FROM skills;
DELETE FROM tags;

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
    '20000000-0000-4000-8000-000000000001',
    'test-fixture-typescript',
    'Fixture TypeScript',
    'Frontend',
    'Synthetic test fixture for visible skill reads.',
    'Synthetic evidence for integration tests.',
    2,
    true,
    '2025-01-01T00:00:00Z',
    '2025-01-01T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'test-fixture-postgresql',
    'Fixture PostgreSQL',
    'Database',
    'Synthetic test fixture for relational reads.',
    'Synthetic evidence for integration tests.',
    1,
    true,
    '2025-01-01T00:00:00Z',
    '2025-01-01T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'test-fixture-hidden-skill',
    'Fixture Hidden Skill',
    'Internal',
    'Synthetic hidden skill for visibility tests.',
    'Synthetic evidence for integration tests.',
    3,
    false,
    '2025-01-01T00:00:00Z',
    '2025-01-01T00:00:00Z'
  );

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
    '21000000-0000-4000-8000-000000000001',
    'test-fixture-featured-project',
    'Fixture Featured Project',
    'Synthetic featured project for repository integration tests.',
    E'# Fixture Featured Project\n\nSynthetic test content only.',
    'published',
    true,
    2,
    '2025-02-02T00:00:00Z',
    'Fixture Featured Project',
    'Synthetic featured project for integration tests.',
    NULL,
    NULL,
    NULL,
    '2025-01-02T00:00:00Z',
    '2025-01-02T00:00:00Z'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    'test-fixture-standard-project',
    'Fixture Standard Project',
    'Synthetic published project for deterministic ordering tests.',
    E'# Fixture Standard Project\n\nSynthetic test content only.',
    'published',
    false,
    1,
    '2025-02-01T00:00:00Z',
    'Fixture Standard Project',
    'Synthetic standard project for integration tests.',
    NULL,
    NULL,
    NULL,
    '2025-01-03T00:00:00Z',
    '2025-01-03T00:00:00Z'
  ),
  (
    '21000000-0000-4000-8000-000000000003',
    'test-fixture-draft-project',
    'Fixture Draft Project',
    'Synthetic draft project for publication-filter tests.',
    E'# Fixture Draft Project\n\nThis synthetic fixture must remain unpublished.',
    'draft',
    false,
    0,
    NULL,
    'Fixture Draft Project',
    'Synthetic draft project for integration tests.',
    NULL,
    NULL,
    NULL,
    '2025-01-04T00:00:00Z',
    '2025-01-04T00:00:00Z'
  );

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
    '22000000-0000-4000-8000-000000000001',
    'test-fixture-published-post',
    'Fixture Published Post',
    'Synthetic published post for relation tests.',
    E'# Fixture Published Post\n\nSynthetic test content only.',
    'article',
    'published',
    '2025-03-01T00:00:00Z',
    'Fixture Published Post',
    'Synthetic published post for integration tests.',
    NULL,
    '2025-01-05T00:00:00Z',
    '2025-01-05T00:00:00Z'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    'test-fixture-draft-post',
    'Fixture Draft Post',
    'Synthetic draft post for publication-filter tests.',
    E'# Fixture Draft Post\n\nThis synthetic fixture must remain unpublished.',
    'retrospective',
    'draft',
    NULL,
    'Fixture Draft Post',
    'Synthetic draft post for integration tests.',
    NULL,
    '2025-01-06T00:00:00Z',
    '2025-01-06T00:00:00Z'
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    'test-fixture-published-retrospective',
    'Fixture Published Retrospective',
    'Synthetic published retrospective for repository integration tests.',
    E'# Fixture Published Retrospective\n\nSynthetic retrospective content only.',
    'retrospective',
    'published',
    '2025-03-02T00:00:00Z',
    'Fixture Published Retrospective',
    'Synthetic published retrospective for integration tests.',
    NULL,
    '2025-01-07T00:00:00Z',
    '2025-01-07T00:00:00Z'
  ),
  (
    '22000000-0000-4000-8000-000000000004',
    'test-fixture-draft-article',
    'Fixture Draft Article',
    'Synthetic draft article for publication-filter tests.',
    E'# Fixture Draft Article\n\nThis synthetic fixture must remain unpublished.',
    'article',
    'draft',
    NULL,
    'Fixture Draft Article',
    'Synthetic draft article for integration tests.',
    NULL,
    '2025-01-08T00:00:00Z',
    '2025-01-08T00:00:00Z'
  ),
  (
    '22000000-0000-4000-8000-000000000005',
    'test-fixture-older-article',
    'Fixture Older Article',
    'Synthetic older article for deterministic ordering tests.',
    E'# Fixture Older Article\n\nSynthetic article content only.',
    'article',
    'published',
    '2025-02-28T00:00:00Z',
    'Fixture Older Article',
    'Synthetic older article for integration tests.',
    NULL,
    '2025-01-09T00:00:00Z',
    '2025-01-09T00:00:00Z'
  );

INSERT INTO tags (id, slug, name, created_at, updated_at)
VALUES
  (
    '23000000-0000-4000-8000-000000000001',
    'test-fixture-database',
    'Fixture Database',
    '2025-01-01T00:00:00Z',
    '2025-01-01T00:00:00Z'
  ),
  (
    '23000000-0000-4000-8000-000000000002',
    'test-fixture-architecture',
    'Fixture Architecture',
    '2025-01-01T00:00:00Z',
    '2025-01-01T00:00:00Z'
  );

INSERT INTO project_skills (project_id, skill_id)
VALUES
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002'),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003');

INSERT INTO post_tags (post_id, tag_id)
VALUES
  ('22000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001'),
  ('22000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000002'),
  ('22000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000002'),
  ('22000000-0000-4000-8000-000000000003', '23000000-0000-4000-8000-000000000001'),
  ('22000000-0000-4000-8000-000000000003', '23000000-0000-4000-8000-000000000002'),
  ('22000000-0000-4000-8000-000000000004', '23000000-0000-4000-8000-000000000001');

INSERT INTO post_projects (post_id, project_id)
VALUES
  ('22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001'),
  ('22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000003'),
  ('22000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000002'),
  ('22000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000003');

COMMIT;
