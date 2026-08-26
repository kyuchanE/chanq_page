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

The default check runs the repository harness, skill validation, Markdown-link validation, Prettier check, ESLint, TypeScript, Vitest, Drizzle migration consistency, and the production build. It intentionally does not start Docker or a browser.

Run service-dependent and production-like browser checks explicitly when they are relevant:

```bash
pnpm db:test:integration
pnpm test:e2e
```

Install the pinned Playwright Chromium build once per development environment with `pnpm exec playwright install chromium`. Use `$validate-project-change` for a risk-based validation pass. Record exactly which commands ran and distinguish failures from checks that were unavailable or intentionally not run.

## Working with infrastructure

Use `$operate-local-stack` before changing Docker, PostgreSQL, Nginx, or Cloudflare Tunnel configuration. Confirm whether work targets the Apple Silicon development Mac, the separate Apple Silicon production Mac, or an isolated test or restore environment. Inspect first, verify `linux/arm64` support, keep secrets and volumes separated, validate rendered configuration, add health checks, and document rollback or recovery for consequential changes.

Promote schema with committed migrations and content through the validated import path. Never copy PostgreSQL data directories or Docker volumes between hosts. Reserve `pg_dump` custom-format logical backups for a verified one-time initial bootstrap or disaster recovery, run `pg_restore` against an isolated database first, and require separate authority for production cutover.

## Handoff format

Every completed task should state:

- Outcome and user-visible behavior
- Important implementation or architecture choices
- Files or areas changed
- Commands run and their results
- Documentation or ADR updates
- Assumptions, deferred work, and remaining risks

## Implemented foundations

The initial application and local database foundations are complete:

1. The empty Next.js scaffold was generated in a temporary directory using the approved settings in `docs/architecture/technology-baseline.md`.
2. Package metadata, strict TypeScript, App Router, Tailwind CSS, ESLint, React Compiler, Turbopack, and the `@/*` alias were reviewed and merged without replacing repository-owned instructions or documentation.
3. Zod validates development and test connection URLs, while actual local credentials stay in ignored `.env.local`.
4. PostgreSQL 16.14 runs in a loopback-only `linux/arm64` container with separate development and test databases.
5. The typed Drizzle schema, reviewed initial SQL migration, migration ledger, status command, and transactional schema checks are implemented.
6. Prettier checks code and configuration while preserving manually maintained Markdown and generated migration artifacts.
7. Vitest, React Testing Library, and DOM matchers provide unit and synchronous component tests with Node and jsdom environments.
8. Playwright runs critical browser smoke tests against a production build and local Next.js server.
9. `scripts/check.sh` enforces all fast repository and application gates, including the production build, without starting Docker or a browser.
10. The PostgreSQL project and skill repositories validate public rows and have isolated application-role integration coverage for publication/visibility state, ordering, relations, and adapter errors.
11. Playwright resets and uses the isolated test database for dynamic Projects and Skills journeys, including refresh, metadata, responsive layout, keyboard access, and project 404 behavior.

The ordered queue of unfinished development and local validation work is maintained only in `docs/project-roadmap.md`.
