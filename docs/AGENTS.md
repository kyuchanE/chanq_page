# Documentation Instructions

This directory is the maintained project knowledge base. Keep `index.md` as the complete navigation entry point and link every durable document from it.

- Describe the present system in present tense and planned work explicitly as planned.
- Separate product requirements, architecture, development workflow, and operations.
- Prefer one authoritative explanation over duplicated guidance.
- Include dates only when history matters; use Git for ordinary change history.
- Use diagrams only when they clarify boundaries, dependencies, or a multi-step flow.
- Check relative links with `./scripts/check-markdown-links.py` after documentation changes.
- Update affected docs in the same change as code or configuration.

Do not place agent procedures here; reusable Codex procedures belong in `.agents/skills/`.

## Product documents

- Describe user problems, audiences, outcomes, scope, and measurable success without implementation guesses.
- Distinguish MVP, post-MVP, and excluded work.
- Write acceptance criteria as observable behavior and state adoption gates for deferred capabilities.
- Reconcile intentional scope changes with `portfolio-project-plan.md`.

## Architecture documents and ADRs

- Keep boundary names aligned with actual directories and imports; document dependency direction, data flow, trust boundaries, and runtime ownership.
- Add an ADR for durable decisions affecting multiple areas, data ownership, security, deployment, or costly migrations.
- Name ADRs with the next four-digit sequence and a short kebab-case title.
- Include Status, Context, Decision, Alternatives considered, Consequences, and Revisit when.
- Supersede an accepted ADR with a new linked ADR instead of rewriting its decision history.
- Link every ADR from `docs/index.md` and update `system-overview.md` when topology changes.

## Development documents

- Document repeatable workflows from a clean checkout with prerequisites and expected outcomes.
- Keep commands executable, idempotent, and consistent with package scripts and root automation.
- Link to project-local skills instead of duplicating agent procedures.

## Operations documents

- Separate local, staging, and production assumptions.
- Use placeholders for domains, credentials, tokens, and host paths.
- Prefer read-only diagnostics and include success signals, failure signals, rollback, and recovery.
- Identify ownership for caches and persistent volumes.
- Never document a production-destructive operation without an explicit backup and confirmation step.
