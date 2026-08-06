BEGIN;

DELETE FROM skills
WHERE id = '20000000-0000-4000-8000-000000000001';

INSERT INTO tags (id, slug, name, created_at, updated_at)
VALUES (
  '23999999-9999-4999-8999-999999999999',
  'test-fixture-reset-probe',
  'Fixture reset probe',
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

COMMIT;
