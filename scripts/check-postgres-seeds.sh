#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
SNAPSHOT_FILE="${REPOSITORY_ROOT}/tests/integration/postgres/seed-identity-snapshot.sql"
DEVELOPMENT_TEST_FILE="${REPOSITORY_ROOT}/tests/integration/postgres/development-seed.test.sql"
TEST_FIXTURE_TEST_FILE="${REPOSITORY_ROOT}/tests/integration/postgres/test-fixture.test.sql"
TEST_DRIFT_FILE="${REPOSITORY_ROOT}/tests/fixtures/postgres/introduce-reset-drift.sql"
DEVELOPMENT_SEED_FILE="${REPOSITORY_ROOT}/infrastructure/postgres/seeds/development.sql"
TEST_RESET_FILE="${REPOSITORY_ROOT}/tests/fixtures/postgres/reset-content.sql"
test_reset_required=false

usage() {
  echo "Usage: ./scripts/check-postgres-seeds.sh --allow-fixture-reset"
}

if [[ $# -ne 1 || "$1" != "--allow-fixture-reset" ]]; then
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

run_seed() {
  "${SCRIPT_DIR}/seed-postgres.sh" "$@" >/dev/null
}

run_sql() {
  local password_variable="$1"
  local role_variable="$2"
  local database_variable="$3"
  local sql_file="$4"

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
      --set=ON_ERROR_STOP=1
  ' sh "${password_variable}" "${role_variable}" "${database_variable}" \
    < "${sql_file}"
}

capture_identity() {
  local password_variable="$1"
  local role_variable="$2"
  local database_variable="$3"
  local fixture_prefix="$4"

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
      --set=fixture_prefix="$4" \
      --tuples-only \
      --no-align
  ' sh \
    "${password_variable}" \
    "${role_variable}" \
    "${database_variable}" \
    "${fixture_prefix}" \
    < "${SNAPSHOT_FILE}"
}

restore_test_fixture_on_exit() {
  local exit_code=$?
  trap - EXIT

  if [[ "${test_reset_required}" == true ]]; then
    if ! run_seed test --allow-reset; then
      echo "Failed to restore isolated test fixtures during cleanup." >&2
    fi
  fi

  exit "${exit_code}"
}

trap restore_test_fixture_on_exit EXIT

if run_sql \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  "${DEVELOPMENT_SEED_FILE}" \
  >/dev/null 2>&1; then
  echo "Development seed SQL accepted the test database boundary." >&2
  exit 1
fi

if run_sql \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB \
  "${TEST_RESET_FILE}" \
  >/dev/null 2>&1; then
  echo "Test reset SQL accepted the development database boundary." >&2
  exit 1
fi

run_seed development --allow-seed
development_first="$(capture_identity \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB \
  'dev-seed-%')"

run_seed development --allow-seed
development_second="$(capture_identity \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB \
  'dev-seed-%')"

if [[ -z "${development_first}" || "${development_first}" != "${development_second}" ]]; then
  echo "Repeated development seeds changed fixture identities or counts." >&2
  exit 1
fi

run_sql \
  POSTGRES_APP_PASSWORD \
  POSTGRES_APP_USER \
  POSTGRES_DB \
  "${DEVELOPMENT_TEST_FILE}"

run_seed test --allow-reset
test_baseline="$(capture_identity \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  'test-fixture-%')"

test_reset_required=true
run_sql \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  "${TEST_DRIFT_FILE}" \
  >/dev/null
test_drifted="$(capture_identity \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  'test-fixture-%')"

if [[ "${test_baseline}" == "${test_drifted}" ]]; then
  echo "Test fixture drift probe did not change the isolated test database." >&2
  exit 1
fi

run_seed test --allow-reset
test_reset_required=false
test_restored="$(capture_identity \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  'test-fixture-%')"

if [[ -z "${test_baseline}" || "${test_baseline}" != "${test_restored}" ]]; then
  echo "Test fixture reset did not restore stable identities and counts." >&2
  exit 1
fi

run_sql \
  POSTGRES_TEST_APP_PASSWORD \
  POSTGRES_TEST_APP_USER \
  POSTGRES_TEST_DB \
  "${TEST_FIXTURE_TEST_FILE}"

trap - EXIT
echo "Deterministic PostgreSQL seed and fixture checks passed."
