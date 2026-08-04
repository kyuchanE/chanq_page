#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

required_files=(
  "AGENTS.md"
  "README.md"
  "portfolio-project-plan.md"
  "docs/index.md"
  "docs/product/project-scope.md"
  "docs/architecture/system-overview.md"
  "docs/development/codex-workflow.md"
  "docs/operations/deployment-topology.md"
  ".agents/skills/plan-project-change/SKILL.md"
  ".agents/skills/implement-nextjs-feature/SKILL.md"
  ".agents/skills/validate-project-change/SKILL.md"
  ".agents/skills/operate-local-stack/SKILL.md"
)

failures=0

for relative_path in "${required_files[@]}"; do
  if [[ ! -f "${REPO_ROOT}/${relative_path}" ]]; then
    echo "ERROR: Required file is missing: ${relative_path}" >&2
    failures=$((failures + 1))
  fi
done

while IFS= read -r -d '' directory; do
  relative_directory="${directory#"${REPO_ROOT}/"}"

  if [[ "${directory}" == "${REPO_ROOT}" ]]; then
    continue
  fi

  if git -C "${REPO_ROOT}" check-ignore --quiet -- "${relative_directory}"; then
    continue
  fi

  if [[ ! -f "${directory}/AGENTS.md" ]]; then
    echo "ERROR: Directory-scoped instructions are missing: ${relative_directory}/AGENTS.md" >&2
    failures=$((failures + 1))
  fi
done < <(
  find "${REPO_ROOT}" -type d \
    -not -path "${REPO_ROOT}/.git" \
    -not -path "${REPO_ROOT}/.git/*" \
    -not -path "${REPO_ROOT}/.next" \
    -not -path "${REPO_ROOT}/.next/*" \
    -not -path "${REPO_ROOT}/node_modules" \
    -not -path "${REPO_ROOT}/node_modules/*" \
    -not -path "${REPO_ROOT}/coverage" \
    -not -path "${REPO_ROOT}/coverage/*" \
    -not -path "${REPO_ROOT}/out" \
    -not -path "${REPO_ROOT}/out/*" \
    -print0
)

while IFS= read -r -d '' skill_file; do
  if grep -q '\[TODO' "${skill_file}"; then
    relative_skill="${skill_file#"${REPO_ROOT}/"}"
    echo "ERROR: Skill still contains template TODO text: ${relative_skill}" >&2
    failures=$((failures + 1))
  fi
done < <(find "${REPO_ROOT}/.agents/skills" -mindepth 2 -maxdepth 2 -name SKILL.md -print0)

if (( failures > 0 )); then
  echo "Harness validation failed with ${failures} error(s)." >&2
  exit 1
fi

echo "Harness structure is valid."
