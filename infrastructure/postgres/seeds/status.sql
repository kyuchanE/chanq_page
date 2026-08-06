SELECT
  :'dataset_name' AS dataset,
  current_database() AS database,
  current_user AS role;

SELECT
  'projects' AS table_name,
  count(*) AS total_rows,
  count(*) FILTER (WHERE slug LIKE :'fixture_prefix') AS fixture_rows
FROM projects
UNION ALL
SELECT
  'posts',
  count(*),
  count(*) FILTER (WHERE slug LIKE :'fixture_prefix')
FROM posts
UNION ALL
SELECT
  'skills',
  count(*),
  count(*) FILTER (WHERE key LIKE :'fixture_prefix')
FROM skills
UNION ALL
SELECT
  'tags',
  count(*),
  count(*) FILTER (WHERE slug LIKE :'fixture_prefix')
FROM tags
ORDER BY table_name;
