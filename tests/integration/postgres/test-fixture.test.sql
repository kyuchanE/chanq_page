DO $$
DECLARE
  actual_count integer;
BEGIN
  IF current_database() <> 'chanq_page_test' OR current_user <> 'chanq_page_test_app' THEN
    RAISE EXCEPTION 'Test fixture test is connected to an unexpected boundary';
  END IF;

  SELECT count(*) INTO actual_count FROM projects;
  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'Expected exactly 3 test projects, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM posts;
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected exactly 2 test posts, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM skills;
  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'Expected exactly 3 test skills, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM tags;
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected exactly 2 test tags, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM project_skills;
  IF actual_count <> 4 THEN
    RAISE EXCEPTION 'Expected exactly 4 test project-skill relations, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM post_tags;
  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'Expected exactly 3 test post-tag relations, found %', actual_count;
  END IF;

  SELECT count(*) INTO actual_count FROM post_projects;
  IF actual_count <> 2 THEN
    RAISE EXCEPTION 'Expected exactly 2 test post-project relations, found %', actual_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = '21000000-0000-4000-8000-000000000001'
      AND slug = 'test-fixture-featured-project'
      AND status = 'published'
      AND featured
      AND created_at = '2025-01-02T00:00:00Z'
  ) OR NOT EXISTS (
    SELECT 1 FROM skills
    WHERE id = '20000000-0000-4000-8000-000000000003'
      AND key = 'test-fixture-hidden-skill'
      AND NOT visible
  ) OR NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = '22000000-0000-4000-8000-000000000002'
      AND slug = 'test-fixture-draft-post'
      AND kind = 'retrospective'
      AND status = 'draft'
      AND published_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Test fixture identities or fixed values drifted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM projects WHERE slug LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1 FROM posts WHERE slug LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1 FROM skills WHERE key LIKE 'dev-seed-%'
  ) OR EXISTS (
    SELECT 1 FROM tags WHERE slug LIKE 'dev-seed-%'
  ) THEN
    RAISE EXCEPTION 'Development seed data leaked into the test database';
  END IF;
END $$;
