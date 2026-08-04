---
name: plan-project-change
description: Plan an evidence-based repository change from a user request, project documentation, scoped AGENTS.md rules, current code, tests, and Git state. Use for multi-file features, architectural or infrastructure changes, dependency additions, ambiguous requests, migrations, or any task that needs acceptance criteria, sequencing, risk analysis, and a validation plan before implementation.
---

# Plan Project Change

Turn a requested change into an implementation-ready plan without modifying production code.

## Procedure

1. Read the root `AGENTS.md`, `docs/index.md`, relevant linked documents, and every scoped `AGENTS.md` that would govern likely files.
2. Inspect the current repository tree, relevant implementation and tests, configuration, and Git status or diff. Treat the working tree as user-owned and preserve unrelated changes.
3. State the requested outcome as observable acceptance criteria. Separate facts, assumptions, open questions, and exclusions.
4. Locate the smallest feature or infrastructure boundary that can own the change. Check dependency direction in `docs/architecture/system-overview.md`.
5. Test proportionality. Reject speculative services, database work, client state, abstractions, or Clean Architecture layers that do not protect a current rule, side effect, variation, or test seam.
6. Identify affected files, interfaces, data shapes, trust boundaries, rendering behavior, caching, accessibility, SEO, security, and operations.
7. Decide whether the change requires an ADR using `docs/development/codex-workflow.md`. Include the ADR and `docs/index.md` update in the plan when required.
8. Break work into ordered, independently verifiable vertical slices. Keep at most one slice in progress during execution.
9. Attach validation to each risky slice and finish with `./scripts/check.sh`, targeted tests, and a production build when runtime code is affected.

## Plan format

Provide:

- Outcome and acceptance criteria
- Current evidence and constraints
- Explicit assumptions and out-of-scope items
- Architectural boundary and dependency direction
- Ordered steps with concrete file areas and a verification result for each step
- Documentation and ADR work
- Risks, rollback or migration considerations, and unresolved decisions

Ask the user only when a missing choice would materially change product behavior, data modeling, security boundaries, cost, or external state. Otherwise choose the smallest reversible assumption and label it.
