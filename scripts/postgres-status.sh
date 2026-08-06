#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"

usage() {
  echo "Usage: ./scripts/postgres-status.sh"
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

echo "Container status"
"${compose[@]}" ps postgres

if [[ -z "$("${compose[@]}" ps --status running --services postgres)" ]]; then
  echo "PostgreSQL is not running." >&2
  exit 1
fi

echo
echo "Development database"
"${compose[@]}" exec -T postgres sh -c \
  'pg_isready --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" && psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --no-psqlrc --command="SELECT current_database() AS database, current_user AS role, current_setting('\''server_version'\'') AS version;" --command="SELECT rolsuper AS is_superuser, rolcanlogin AS can_login FROM pg_roles WHERE rolname = current_user;" --command="SELECT count(*) AS applied_migrations, max(created_at) AS latest_migration_timestamp FROM drizzle.__drizzle_migrations;" --command="SELECT count(*) AS content_table_count FROM information_schema.tables WHERE table_schema = '\''public'\'';"'

echo
echo "Test database"
"${compose[@]}" exec -T postgres sh -c \
  'pg_isready --username "$POSTGRES_USER" --dbname "$POSTGRES_TEST_DB" && psql --username "$POSTGRES_USER" --dbname "$POSTGRES_TEST_DB" --no-psqlrc --command="SELECT current_database() AS database, current_user AS role, current_setting('\''server_version'\'') AS version;" --command="SELECT count(*) AS applied_migrations, max(created_at) AS latest_migration_timestamp FROM drizzle.__drizzle_migrations;" --command="SELECT count(*) AS content_table_count FROM information_schema.tables WHERE table_schema = '\''public'\'';"'

echo
echo "Application role policy"
"${compose[@]}" exec -T postgres sh -c \
  'psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --no-psqlrc --set=ON_ERROR_STOP=1 --set=development_role="$POSTGRES_APP_USER" --set=test_role="$POSTGRES_TEST_APP_USER" --set=development_database="$POSTGRES_DB" --set=test_database="$POSTGRES_TEST_DB" --file=/opt/chanq-page/postgres/roles/application-role-status.sql'
