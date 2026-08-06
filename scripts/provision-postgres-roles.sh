#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPOSITORY_ROOT}/.env.local"
COMPOSE_FILE="${REPOSITORY_ROOT}/infrastructure/compose.local.yaml"

usage() {
  echo "Usage: ./scripts/provision-postgres-roles.sh"
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

"${compose[@]}" exec -T postgres \
  /docker-entrypoint-initdb.d/020-provision-application-roles.sh
