#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
DEVELOPMENT_SEED_FILE="${REPOSITORY_ROOT}/infrastructure/postgres/seeds/development.sql"
TEST_FIXTURE_FILE="${REPOSITORY_ROOT}/tests/fixtures/postgres/reset-content.sql"

usage() {
  echo "Usage: ./scripts/seed-postgres.sh development --allow-seed"
  echo "       ./scripts/seed-postgres.sh test --allow-reset"
}

if [[ $# -ne 2 ]]; then
  usage >&2
  exit 2
fi

target="$1"
confirmation="$2"

case "${target}:${confirmation}" in
  development:--allow-seed)
    password_variable="POSTGRES_APP_PASSWORD"
    role_variable="POSTGRES_APP_USER"
    database_variable="POSTGRES_DB"
    sql_file="${DEVELOPMENT_SEED_FILE}"
    success_message="Deterministic development seed applied."
    ;;
  test:--allow-reset)
    password_variable="POSTGRES_TEST_APP_PASSWORD"
    role_variable="POSTGRES_TEST_APP_USER"
    database_variable="POSTGRES_TEST_DB"
    sql_file="${TEST_FIXTURE_FILE}"
    success_message="Isolated test fixtures reset."
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env.local. Copy .env.example and set local-only values." >&2
  exit 1
fi

if [[ ! -f "${sql_file}" ]]; then
  echo "Missing seed SQL: ${sql_file}" >&2
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

"${compose[@]}" exec -T postgres sh -c '
  set -eu

  if [ "$POSTGRES_DB" = "$POSTGRES_TEST_DB" ]; then
    echo "Development and test database names must differ." >&2
    exit 1
  fi

  if [ "$POSTGRES_APP_USER" = "$POSTGRES_TEST_APP_USER" ]; then
    echo "Development and test application roles must differ." >&2
    exit 1
  fi

  case "$POSTGRES_TEST_DB" in
    *_test) ;;
    *)
      echo "Test fixture reset requires a database name ending in _test." >&2
      exit 1
      ;;
  esac
'

"${compose[@]}" exec -T postgres sh -c '
  set -eu

  password="$(printenv "$1")"
  role="$(printenv "$2")"
  database="$(printenv "$3")"

  if [ -z "${password}" ] || [ -z "${role}" ] || [ -z "${database}" ]; then
    echo "The selected PostgreSQL seed environment is incomplete." >&2
    exit 1
  fi

  PGPASSWORD="${password}" psql \
    --host=127.0.0.1 \
    --username="${role}" \
    --dbname="${database}" \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1
' sh "${password_variable}" "${role_variable}" "${database_variable}" \
  < "${sql_file}"

echo "${success_message}"
