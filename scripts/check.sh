#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

usage() {
  echo "Usage: ./scripts/check.sh"
}

if [[ $# -gt 0 ]]; then
  usage >&2
  exit 2
fi

"${SCRIPT_DIR}/check-harness.sh"
"${SCRIPT_DIR}/check-skills.py"
"${SCRIPT_DIR}/check-markdown-links.py"

if [[ -f "${REPOSITORY_ROOT}/package.json" ]]; then
  if ! command -v corepack >/dev/null 2>&1; then
    echo "corepack is required to run application checks." >&2
    exit 1
  fi

  cd "${REPOSITORY_ROOT}"
  corepack pnpm format:check
  corepack pnpm lint
  corepack pnpm typecheck
  corepack pnpm test
  corepack pnpm content:media:verify --file content/examples/media-policy-demo.json
  corepack pnpm db:check
  corepack pnpm build
else
  echo "Application package checks: skipped (package.json has not been created yet)."
fi

echo "All available repository checks passed."
