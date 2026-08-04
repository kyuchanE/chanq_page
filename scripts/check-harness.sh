#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

required_files=(
  "README.md"
  "portfolio-project-plan.md"
  "docs/index.md"
  "docs/product/project-scope.md"
  "docs/architecture/system-overview.md"
  "docs/architecture/technology-baseline.md"
  "docs/architecture/data-model.md"
  "docs/architecture/decisions/0003-use-postgresql-for-mvp-content.md"
  "docs/development/codex-workflow.md"
  "docs/operations/deployment-topology.md"
  "docs/operations/postgresql-lifecycle.md"
  ".agents/skills/plan-project-change/SKILL.md"
  ".agents/skills/implement-nextjs-feature/SKILL.md"
  ".agents/skills/validate-project-change/SKILL.md"
  ".agents/skills/operate-local-stack/SKILL.md"
)

agent_boundaries=(
  "AGENTS.md"
  "docs/AGENTS.md"
  "src/app/AGENTS.md"
  "src/features/AGENTS.md"
  "src/shared/AGENTS.md"
  "content/AGENTS.md"
  "infrastructure/AGENTS.md"
  "tests/AGENTS.md"
  "scripts/AGENTS.md"
  ".agents/skills/AGENTS.md"
)

failures=0

for relative_path in "${required_files[@]}"; do
  if [[ ! -f "${REPO_ROOT}/${relative_path}" ]]; then
    echo "ERROR: Required file is missing: ${relative_path}" >&2
    failures=$((failures + 1))
  fi
done

for relative_path in "${agent_boundaries[@]}"; do
  if [[ ! -f "${REPO_ROOT}/${relative_path}" ]]; then
    echo "ERROR: Required instruction boundary is missing: ${relative_path}" >&2
    failures=$((failures + 1))
  fi
done

while IFS= read -r -d '' agent_file; do
  relative_agent_file="${agent_file#"${REPO_ROOT}/"}"
  allowed=false

  for boundary in "${agent_boundaries[@]}"; do
    if [[ "${relative_agent_file}" == "${boundary}" ]]; then
      allowed=true
      break
    fi
  done

  if [[ "${allowed}" == false ]]; then
    echo "ERROR: AGENTS.md exists outside an approved boundary: ${relative_agent_file}" >&2
    failures=$((failures + 1))
  fi
done < <(
  find "${REPO_ROOT}" -name AGENTS.md -type f \
    -not -path "${REPO_ROOT}/.git/*" \
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
