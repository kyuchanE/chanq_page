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

INSERT INTO skills (key, name, category, summary, evidence)
VALUES ('postgresql', 'PostgreSQL', 'Database', 'Relational data modeling', 'Schema migration evidence');

INSERT INTO projects (
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
  'portfolio',
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
  'first-post',
  'First post',
  'A test post',
  '# First post',
  'published',
  now(),
  'First post',
  'First post details'
);

INSERT INTO tags (slug, name)
VALUES ('database', 'Database');

INSERT INTO project_skills (project_id, skill_id)
SELECT projects.id, skills.id
FROM projects
CROSS JOIN skills
WHERE projects.slug = 'portfolio'
  AND skills.key = 'postgresql';

INSERT INTO post_tags (post_id, tag_id)
SELECT posts.id, tags.id
FROM posts
CROSS JOIN tags
WHERE posts.slug = 'first-post'
  AND tags.slug = 'database';

INSERT INTO post_projects (post_id, project_id)
SELECT posts.id, projects.id
FROM posts
CROSS JOIN projects
WHERE posts.slug = 'first-post'
  AND projects.slug = 'portfolio';

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
    VALUES ('database', 'Duplicate database tag');

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
    (SELECT count(*) FROM post_tags) +
    (SELECT count(*) FROM post_projects) +
    (SELECT count(*) FROM project_skills)
  INTO relation_count;

  IF relation_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 content relations, found %', relation_count;
  END IF;
END $$;

DELETE FROM posts
WHERE slug = 'first-post';

DO $$
DECLARE
  post_relation_count integer;
BEGIN
  SELECT
    (SELECT count(*) FROM post_tags) +
    (SELECT count(*) FROM post_projects)
  INTO post_relation_count;

  IF post_relation_count <> 0 THEN
    RAISE EXCEPTION 'Post relation cascade did not remove all rows';
  END IF;
END $$;

ROLLBACK;
