# Codex Development Workflow

## Why the harness is layered

The repository separates four kinds of knowledge:

- `AGENTS.md` files contain rules that apply automatically by directory scope.
- `docs/` contains product truth, current architecture, decisions, contributor guidance, and runbooks.
- `.agents/skills/` contains opt-in, repeatable procedures for common work.
- `scripts/` contains deterministic checks and automation that should not depend on an agent remembering every step.

Rules belong in `AGENTS.md`; facts and decisions belong in docs; procedures belong in skills; repeatable mechanics belong in scripts.

## Starting a task

1. Read the root `AGENTS.md`.
2. Open `docs/index.md` and follow links relevant to the task.
3. Read scoped `AGENTS.md` files for every directory likely to change.
4. Inspect the current files, tests, configuration, and Git diff.
5. Convert the request into observable acceptance criteria.
6. Use `$plan-project-change` when the change crosses multiple files or boundaries, introduces a dependency, changes persistence, or changes deployment behavior.

## Implementing a change

1. Choose the smallest vertical slice that produces observable value.
2. Put framework composition in `src/app/` and feature behavior in `src/features/`.
3. Introduce Clean Architecture layers only where rules, side effects, or test seams justify them.
4. Validate all input at trust boundaries.
5. Add tests close to pure behavior and cross-boundary tests only where integration risk exists.
6. Use `$implement-nextjs-feature` for the standard implementation sequence.
7. Keep comments focused on why a constraint exists or why a non-obvious choice is safe.

## Deciding whether to add an ADR

Add an ADR when a choice is durable and one of the following is true:

- It changes dependency direction or module boundaries.
- It selects or replaces a database, API style, content source, cache, authentication model, or deployment topology.
- It changes security or data ownership.
- Reversing it would require a migration or coordinated changes.
- Future contributors are likely to ask why the choice was made.

Do not create ADRs for ordinary component structure, easily reversible naming, or routine dependency upgrades.

## Validating a change

Run:

```bash
./scripts/check.sh
```

As runtime tooling is added, run the relevant format, lint, type-check, unit, integration, end-to-end, and build scripts. Use `$validate-project-change` for a risk-based validation pass. Record exactly which commands ran and distinguish failures from checks that were unavailable or intentionally not run.

## Working with infrastructure

Use `$operate-local-stack` before changing Docker, PostgreSQL, Nginx, or Cloudflare Tunnel configuration. Inspect first, keep secrets out of the repository, validate rendered configuration, add health checks, and document rollback or recovery for consequential changes.

## Handoff format

Every completed task should state:

- Outcome and user-visible behavior
- Important implementation or architecture choices
- Files or areas changed
- Commands run and their results
- Documentation or ADR updates
- Assumptions, deferred work, and remaining risks

## Implementation milestones

The initial application scaffold is complete:

1. The empty Next.js scaffold was generated in a temporary directory using the approved settings in `docs/architecture/technology-baseline.md`.
2. Package metadata, strict TypeScript, App Router, Tailwind CSS, ESLint, React Compiler, Turbopack, and the `@/*` alias were reviewed and merged without replacing repository-owned instructions or documentation.

Continue with these reviewable slices:

1. Add Prettier, Vitest, React Testing Library, Playwright, and deterministic package quality gates.
2. Add Zod environment validation and safe `.env.example` placeholders.
3. Add a private PostgreSQL Docker Compose service, Drizzle schema, committed initial migration, and separate development and test seeds.
4. Implement the first database-backed content repository vertical slice with unit and PostgreSQL integration tests.
5. Add the internal content CLI or import entry point for draft and publish behavior.
6. Extend `scripts/check.sh` to run formatting, linting, type checking, tests, migration checks, and the production build.
7. Add production Docker packaging, migration release steps, backup, restore verification, Nginx, and Cloudflare Tunnel incrementally.
