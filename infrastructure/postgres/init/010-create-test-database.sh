#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${POSTGRES_TEST_DB:-}" ]]; then
  echo "POSTGRES_TEST_DB must be set." >&2
  exit 1
fi

psql \
  --set=ON_ERROR_STOP=1 \
  --set=test_database="${POSTGRES_TEST_DB}" \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" <<'SQL'
SELECT format('CREATE DATABASE %I', :'test_database')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'test_database'
) \gexec
SQL
