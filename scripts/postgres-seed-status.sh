#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
STATUS_FILE="${REPOSITORY_ROOT}/infrastructure/postgres/seeds/status.sql"

usage() {
  echo "Usage: ./scripts/postgres-seed-status.sh"
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

run_status() {
  local password_variable="$1"
  local role_variable="$2"
  local database_variable="$3"
  local dataset_name="$4"
  local fixture_prefix="$5"

  "${compose[@]}" exec -T postgres sh -c '
    set -eu

    password="$(printenv "$1")"
    role="$(printenv "$2")"
    database="$(printenv "$3")"

    PGPASSWORD="${password}" psql \
      --host=127.0.0.1 \
      --username="${role}" \
      --dbname="${database}" \
      --no-psqlrc \
      --set=ON_ERROR_STOP=1 \
      --set=dataset_name="$4" \
      --set=fixture_prefix="$5"
  ' sh \
    "${password_variable}" \
    "${role_variable}" \
    "${database_variable}" \
    "${dataset_name}" \
    "${fixture_prefix}" \
    < "${STATUS_FILE}"
}

run_status \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB \
  development \
  'dev-seed-%'

run_status \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  test \
  'test-fixture-%'
