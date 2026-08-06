#!/usr/bin/env bash

set -euo pipefail

ROLE_SQL_DIRECTORY="/opt/chanq-page/postgres/roles"

required_variables=(
  POSTGRES_USER
  POSTGRES_DB
  POSTGRES_TEST_DB
  POSTGRES_APP_USER
  POSTGRES_APP_PASSWORD
  POSTGRES_TEST_APP_USER
  POSTGRES_TEST_APP_PASSWORD
)

for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "${variable_name} must be set." >&2
    exit 1
  fi
done

psql \
  --set=ON_ERROR_STOP=1 \
  --set=development_role="${POSTGRES_APP_USER}" \
  --set=development_password="${POSTGRES_APP_PASSWORD}" \
  --set=test_role="${POSTGRES_TEST_APP_USER}" \
  --set=test_password="${POSTGRES_TEST_APP_PASSWORD}" \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --file "${ROLE_SQL_DIRECTORY}/ensure-application-roles.sql"

grant_application_role() {
  local database_name="$1"
  local application_role="$2"
  local blocked_role="$3"

  psql \
    --set=ON_ERROR_STOP=1 \
    --set=owner_role="${POSTGRES_USER}" \
    --set=database_name="${database_name}" \
    --set=application_role="${application_role}" \
    --set=blocked_role="${blocked_role}" \
    --username "${POSTGRES_USER}" \
    --dbname "${database_name}" \
    --file "${ROLE_SQL_DIRECTORY}/grant-application-role.sql"
}

grant_application_role \
  "${POSTGRES_DB}" \
  "${POSTGRES_APP_USER}" \
  "${POSTGRES_TEST_APP_USER}"

grant_application_role \
  "${POSTGRES_TEST_DB}" \
  "${POSTGRES_TEST_APP_USER}" \
  "${POSTGRES_APP_USER}"

echo "Local PostgreSQL application roles are provisioned."
