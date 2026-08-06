#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
TEST_FILE="${REPOSITORY_ROOT}/tests/integration/postgres/permissions.test.sql"

usage() {
  echo "Usage: ./scripts/check-postgres-permissions.sh"
}

if [[ $# -gt 0 ]]; then
  usage >&2
  exit 2
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env.local. Copy .env.example and set local-only values." >&2
  exit 1
fi

compose=(
  docker compose
  --env-file "${ENV_FILE}"
  --file "${COMPOSE_FILE}"
)

if [[ -z "$("${compose[@]}" ps --status running --services postgres)" ]]; then
  echo "PostgreSQL is not running. Run pnpm db:local:up first." >&2
  exit 1
fi

run_permission_test() {
  local password_variable="$1"
  local role_variable="$2"
  local database_variable="$3"

  "${compose[@]}" exec -T postgres sh -c '
    password="$(printenv "$1")"
    role="$(printenv "$2")"
    database="$(printenv "$3")"

    PGPASSWORD="${password}" psql \
      --host=127.0.0.1 \
      --username="${role}" \
      --dbname="${database}" \
      --no-psqlrc \
      --set=ON_ERROR_STOP=1
  ' sh "${password_variable}" "${role_variable}" "${database_variable}" \
    < "${TEST_FILE}"
}

assert_cross_database_denied() {
  local password_variable="$1"
  local role_variable="$2"
  local forbidden_database_variable="$3"

  if "${compose[@]}" exec -T postgres sh -c '
    password="$(printenv "$1")"
    role="$(printenv "$2")"
    database="$(printenv "$3")"

    PGPASSWORD="${password}" psql \
      --host=127.0.0.1 \
      --username="${role}" \
      --dbname="${database}" \
      --no-psqlrc \
      --command="SELECT 1"
  ' sh "${password_variable}" "${role_variable}" "${forbidden_database_variable}" \
    >/dev/null 2>&1; then
    echo "A local application role connected to its forbidden database." >&2
    exit 1
  fi
}

run_permission_test \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB

run_permission_test \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB

assert_cross_database_denied \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_TEST_DB

assert_cross_database_denied \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_DB

echo "PostgreSQL application-role permission checks passed."
