DO $$
DECLARE
  actual_count integer;
BEGIN
  IF current_database() <> 'chanq_page' OR current_user <> 'chanq_page_app' THEN
    RAISE EXCEPTION 'Development seed test is connected to an unexpected boundary';
  END IF;

  SELECT count(*) INTO actual_count FROM projects WHERE slug LIKE 'dev-seed-%';
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 development seed projects, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM posts WHERE slug LIKE 'dev-seed-%';
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 development seed posts, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM skills WHERE key LIKE 'dev-seed-%';
  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 development seed skills, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM tags WHERE slug LIKE 'dev-seed-%';
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 development seed tags, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count
  FROM project_skills
  WHERE project_id IN (SELECT id FROM projects WHERE slug LIKE 'dev-seed-%');
  IF actual_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 development seed project-skill relations, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count
  FROM post_tags
  WHERE post_id IN (SELECT id FROM posts WHERE slug LIKE 'dev-seed-%');
  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 development seed post-tag relations, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count
  FROM post_projects
  WHERE post_id IN (SELECT id FROM posts WHERE slug LIKE 'dev-seed-%');
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 development seed post-project relations, found %', actual_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = '11000000-0000-4000-8000-000000000001'
      AND slug = 'dev-seed-portfolio-foundation'
      AND status = 'published'
      AND created_at = '2026-01-01T00:00:00Z'
  ) OR NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = '12000000-0000-4000-8000-000000000002'
      AND slug = 'dev-seed-draft-post'
      AND kind = 'retrospective'
      AND status = 'draft'
      AND published_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Development seed identities or fixed values drifted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM projects WHERE slug LIKE 'test-fixture-%'
  ) OR EXISTS (
    SELECT 1 FROM posts WHERE slug LIKE 'test-fixture-%'
  ) OR EXISTS (
    SELECT 1 FROM skills WHERE key LIKE 'test-fixture-%'
  ) OR EXISTS (
    SELECT 1 FROM tags WHERE slug LIKE 'test-fixture-%'
  ) THEN
    RAISE EXCEPTION 'Test fixture data leaked into the development database';
  END IF;
END $$;
