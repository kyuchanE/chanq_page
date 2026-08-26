#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
MIGRATION_DIR="${REPOSITORY_ROOT}/infrastructure/postgres/migrations"
UPGRADE_FIXTURE="${REPOSITORY_ROOT}/tests/fixtures/postgres/migrations/0001-existing-post-classification.sql"
FRESH_TEST="${REPOSITORY_ROOT}/tests/integration/postgres/migrations/full-history.test.sql"
UPGRADE_TEST="${REPOSITORY_ROOT}/tests/integration/postgres/migrations/0001-upgrade-path.test.sql"
FRESH_DATABASE="chanq_page_migration_check_fresh"
UPGRADE_DATABASE="chanq_page_migration_check_upgrade"

usage() {
  echo "Usage: ./scripts/check-postgres-migrations.sh --allow-temporary-databases"
}

if [[ $# -ne 1 || "$1" != "--allow-temporary-databases" ]]; then
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

migration_files=()
while IFS= read -r migration_file; do
  migration_files+=("${migration_file}")
done < <(find "${MIGRATION_DIR}" -maxdepth 1 -type f -name '*.sql' -print | sort)

if [[ ${#migration_files[@]} -lt 2 ]]; then
  echo "Expected at least two committed PostgreSQL migrations." >&2
  exit 1
fi

assert_temporary_database_name() {
  case "$1" in
    chanq_page_migration_check_*) ;;
    *)
      echo "Refusing unexpected temporary database name: $1" >&2
      exit 1
      ;;
  esac
}

drop_temporary_database() {
  local database="$1"
  assert_temporary_database_name "${database}"

  "${compose[@]}" exec -T postgres sh -c '
    set -eu
    dropdb --username="$POSTGRES_USER" --if-exists --force "$1"
  ' sh "${database}" >/dev/null
}

create_temporary_database() {
  local database="$1"
  assert_temporary_database_name "${database}"
  drop_temporary_database "${database}"

  "${compose[@]}" exec -T postgres sh -c '
    set -eu
    createdb --username="$POSTGRES_USER" --template=template0 "$1"
  ' sh "${database}"
}

apply_sql_file() {
  local database="$1"
  local sql_file="$2"

  "${compose[@]}" exec -T postgres sh -c '
    set -eu
    psql \
      --username="$POSTGRES_USER" \
      --dbname="$1" \
      --no-psqlrc \
      --set=ON_ERROR_STOP=1
  ' sh "${database}" < "${sql_file}" >/dev/null
}

cleanup() {
  local exit_code=$?
  trap - EXIT

  drop_temporary_database "${FRESH_DATABASE}" || true
  drop_temporary_database "${UPGRADE_DATABASE}" || true

  exit "${exit_code}"
}

trap cleanup EXIT

create_temporary_database "${FRESH_DATABASE}"
for migration_file in "${migration_files[@]}"; do
  apply_sql_file "${FRESH_DATABASE}" "${migration_file}"
done
apply_sql_file "${FRESH_DATABASE}" "${FRESH_TEST}"

create_temporary_database "${UPGRADE_DATABASE}"
apply_sql_file "${UPGRADE_DATABASE}" "${migration_files[0]}"
apply_sql_file "${UPGRADE_DATABASE}" "${UPGRADE_FIXTURE}"
for ((index = 1; index < ${#migration_files[@]}; index++)); do
  apply_sql_file "${UPGRADE_DATABASE}" "${migration_files[index]}"
done
apply_sql_file "${UPGRADE_DATABASE}" "${UPGRADE_TEST}"

echo "PostgreSQL full migration history and representative upgrade checks passed."
