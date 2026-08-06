#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"
TEST_FILE="${REPOSITORY_ROOT}/tests/integration/postgres/schema.test.sql"

usage() {
  echo "Usage: ./scripts/check-postgres-schema.sh"
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

"${compose[@]}" exec -T postgres sh -c \
  'psql --username "$POSTGRES_USER" --dbname "$POSTGRES_TEST_DB" --no-psqlrc --set=ON_ERROR_STOP=1' \
  < "${TEST_FILE}"

echo "PostgreSQL schema integration checks passed."
