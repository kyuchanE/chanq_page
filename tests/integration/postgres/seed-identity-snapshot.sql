WITH signatures (sort_order, value) AS (
  SELECT
    1,
    format(
      'projects=%s:%s',
      count(*),
      coalesce(string_agg(id::text, ',' ORDER BY id), '')
    )
  FROM projects
  WHERE slug LIKE :'fixture_prefix'
  UNION ALL
  SELECT
    2,
    format(
      'posts=%s:%s',
      count(*),
      coalesce(string_agg(id::text, ',' ORDER BY id), '')
    )
  FROM posts
  WHERE slug LIKE :'fixture_prefix'
  UNION ALL
  SELECT
    3,
    format(
      'skills=%s:%s',
      count(*),
      coalesce(string_agg(id::text, ',' ORDER BY id), '')
    )
  FROM skills
  WHERE key LIKE :'fixture_prefix'
  UNION ALL
  SELECT
    4,
    format(
      'tags=%s:%s',
      count(*),
      coalesce(string_agg(id::text, ',' ORDER BY id), '')
    )
  FROM tags
  WHERE slug LIKE :'fixture_prefix'
  UNION ALL
  SELECT
    5,
    format(
      'project_skills=%s:%s',
      count(*),
      coalesce(
        string_agg(project_id::text || ':' || skill_id::text, ',' ORDER BY project_id, skill_id),
        ''
      )
    )
  FROM project_skills
  WHERE project_id IN (
    SELECT id FROM projects WHERE slug LIKE :'fixture_prefix'
  )
  UNION ALL
  SELECT
    6,
    format(
      'post_tags=%s:%s',
      count(*),
      coalesce(
        string_agg(post_id::text || ':' || tag_id::text, ',' ORDER BY post_id, tag_id),
        ''
      )
    )
  FROM post_tags
  WHERE post_id IN (
    SELECT id FROM posts WHERE slug LIKE :'fixture_prefix'
  )
  UNION ALL
  SELECT
    7,
    format(
      'post_projects=%s:%s',
      count(*),
      coalesce(
        string_agg(post_id::text || ':' || project_id::text, ',' ORDER BY post_id, project_id),
        ''
      )
    )
  FROM post_projects
  WHERE post_id IN (
    SELECT id FROM posts WHERE slug LIKE :'fixture_prefix'
  )
)
SELECT string_agg(value, '|' ORDER BY sort_order)
FROM signatures;
