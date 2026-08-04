# Project Agent Asset Instructions

This directory contains project-local Codex assets. Keep them repository-specific, reviewable, and free of credentials or machine-specific state.

- Put reusable procedures in `skills/`.
- Keep deterministic mechanics in the root `scripts/` directory and call them from skills.
- Do not duplicate product or architecture facts; link to `docs/index.md`.
- Validate changed skills before handoff.
