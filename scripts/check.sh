#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/check-harness.sh"
"${SCRIPT_DIR}/check-skills.py"
"${SCRIPT_DIR}/check-markdown-links.py"

if [[ -f "${SCRIPT_DIR}/../package.json" ]]; then
  echo "Application package detected. Run the package's format, lint, type-check, test, and build quality gates for application changes."
else
  echo "Application package checks: skipped (package.json has not been created yet)."
fi

echo "All available repository checks passed."
