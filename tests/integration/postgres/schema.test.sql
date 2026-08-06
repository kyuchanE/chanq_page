BEGIN;

DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT count(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'posts',
      'projects',
      'skills',
      'tags',
      'post_tags',
      'post_projects',
      'project_skills'
    );

  IF table_count <> 7 THEN
    RAISE EXCEPTION 'Expected 7 content tables, found %', table_count;
  END IF;
END $$;

INSERT INTO skills (id, key, name, category, summary, evidence)
VALUES (
  '90000000-0000-4000-8000-000000000001',
  'schema-probe-postgresql',
  'PostgreSQL',
  'Database',
  'Relational data modeling',
  'Schema migration evidence'
);

INSERT INTO projects (
  id,
  slug,
  title,
  summary,
  body,
  status,
  featured,
  published_at,
  seo_title,
  seo_description
)
VALUES (
  '91000000-0000-4000-8000-000000000001',
  'schema-probe-portfolio',
  'Portfolio',
  'A portfolio project',
  '# Portfolio',
  'published',
  true,
  now(),
  'Portfolio',
  'Portfolio project details'
);

INSERT INTO posts (
  id,
  slug,
  title,
  summary,
  body,
  status,
  published_at,
  seo_title,
  seo_description
)
VALUES (
  '92000000-0000-4000-8000-000000000001',
  'schema-probe-first-post',
  'First post',
  'A test post',
  '# First post',
  'published',
  now(),
  'First post',
  'First post details'
);

INSERT INTO tags (id, slug, name)
VALUES (
  '93000000-0000-4000-8000-000000000001',
  'schema-probe-database',
  'Database'
);

INSERT INTO project_skills (project_id, skill_id)
SELECT projects.id, skills.id
FROM projects
CROSS JOIN skills
WHERE projects.id = '91000000-0000-4000-8000-000000000001'
  AND skills.id = '90000000-0000-4000-8000-000000000001';

INSERT INTO post_tags (post_id, tag_id)
SELECT posts.id, tags.id
FROM posts
CROSS JOIN tags
WHERE posts.id = '92000000-0000-4000-8000-000000000001'
  AND tags.id = '93000000-0000-4000-8000-000000000001';

INSERT INTO post_projects (post_id, project_id)
SELECT posts.id, projects.id
FROM posts
CROSS JOIN projects
WHERE posts.id = '92000000-0000-4000-8000-000000000001'
  AND projects.id = '91000000-0000-4000-8000-000000000001';

DO $$
BEGIN
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
      'missing-publication-time',
      'Invalid published post',
      'This insert must fail',
      '# Invalid',
      'published',
      'Invalid',
      'Missing publication timestamp'
    );

    RAISE EXCEPTION 'Published post without published_at was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO tags (slug, name)
    VALUES ('schema-probe-database', 'Duplicate database tag');

    RAISE EXCEPTION 'Duplicate tag slug was accepted';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;
END $$;

DO $$
DECLARE
  relation_count integer;
BEGIN
  SELECT
    (
      SELECT count(*)
      FROM post_tags
      WHERE post_id = '92000000-0000-4000-8000-000000000001'
    ) +
    (
      SELECT count(*)
      FROM post_projects
      WHERE post_id = '92000000-0000-4000-8000-000000000001'
    ) +
    (
      SELECT count(*)
      FROM project_skills
      WHERE project_id = '91000000-0000-4000-8000-000000000001'
    )
  INTO relation_count;

  IF relation_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 content relations, found %', relation_count;
  END IF;
END $$;

DELETE FROM posts
WHERE id = '92000000-0000-4000-8000-000000000001';

DO $$
DECLARE
  post_relation_count integer;
BEGIN
  SELECT
    (
      SELECT count(*)
      FROM post_tags
      WHERE post_id = '92000000-0000-4000-8000-000000000001'
    ) +
    (
      SELECT count(*)
      FROM post_projects
      WHERE post_id = '92000000-0000-4000-8000-000000000001'
    )
  INTO post_relation_count;

  IF post_relation_count <> 0 THEN
    RAISE EXCEPTION 'Post relation cascade did not remove all rows';
  END IF;
END $$;

ROLLBACK;
