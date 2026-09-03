# Project Documentation

This page answers three questions for contributors and Codex: **what are we building, what is true now, and why were durable decisions made?**

## Read in this order

1. [`../portfolio-project-plan.md`](../portfolio-project-plan.md) — original product vision, MVP scope, roadmap, and risks.
2. [`product/project-scope.md`](product/project-scope.md) — concise current scope, users, acceptance criteria, and adoption gates.
3. [`project-roadmap.md`](project-roadmap.md) — ordered queue of unfinished MVP development and local validation work; production operations are excluded.
4. [`architecture/system-overview.md`](architecture/system-overview.md) — current and target boundaries, dependencies, and data flow.
5. [`architecture/technology-baseline.md`](architecture/technology-baseline.md) — implemented Next.js and local PostgreSQL toolchain plus approved testing and production choices.
6. [`architecture/data-model.md`](architecture/data-model.md) — implemented PostgreSQL content schema and ownership rules.
7. [`development/codex-workflow.md`](development/codex-workflow.md) — how to plan, implement, validate, document, and hand off changes.
8. [`operations/deployment-topology.md`](operations/deployment-topology.md) — Docker, Nginx, Cloudflare Tunnel, and PostgreSQL topology.
9. [`operations/postgresql-lifecycle.md`](operations/postgresql-lifecycle.md) — migration, seed, import, backup, restore, and recovery policy.

## Architecture decisions

- [`ADR-0001: Use Local MDX as the MVP Content Source`](architecture/decisions/0001-use-local-mdx-for-mvp-content.md) — superseded
- [`ADR-0002: Use Proportional Feature-First Clean Architecture`](architecture/decisions/0002-use-proportional-feature-first-clean-architecture.md)
- [`ADR-0003: Use PostgreSQL for MVP Content`](architecture/decisions/0003-use-postgresql-for-mvp-content.md)
- [`ADR-0004: Use Separate Apple Silicon macOS Hosts`](architecture/decisions/0004-use-separate-apple-silicon-macos-hosts.md)
- [`ADR-0005: Promote PostgreSQL Schema and Content Separately`](architecture/decisions/0005-promote-schema-and-content-separately.md)
- [`ADR-0006: Separate Local PostgreSQL Application Roles`](architecture/decisions/0006-separate-local-postgresql-application-roles.md)
- [`ADR-0007: Classify Posts by Kind`](architecture/decisions/0007-classify-posts-by-kind.md)

## Current project state

The repository is in the **MVP PostgreSQL-backed public content** stage:

- Product direction is documented.
- Root and directory-scoped `AGENTS.md` files define working rules.
- Project-local skills define repeatable Codex workflows.
- Deterministic scripts validate the harness and documentation links.
- A minimal `chanq_page` Next.js App Router application is scaffolded with pnpm, strict TypeScript, ESLint, Tailwind CSS, React Compiler, Turbopack, a `src/` root, and the `@/*` alias.
- Static placeholder routes and page metadata remain for Home, About, and Contact. Every route uses the same responsive public shell with semantic landmarks, current-page navigation, visible focus, skip navigation, reduced-motion behavior, and global presentation tokens.
- Projects is the first completed PostgreSQL-backed public slice. Its dynamic list and stable detail route expose only published projects, deterministic featured/display ordering, visible related skills, controlled CommonMark rendering, content-aligned metadata, accessible loading/empty/recoverable-error states, and draft/unknown/malformed-slug 404 behavior.
- Skills is a dynamic PostgreSQL-backed public slice with deterministic category/display ordering, narrative evidence, published-project-only case-study links, and accessible loading/empty/recoverable-error states. It does not expose hidden skills, draft project relations, percentages, or unsupported ratings.
- Blog and Retrospectives are dynamic PostgreSQL-backed list and detail slices over one classified post repository. They expose only published posts of the owning kind in deterministic publication order, controlled CommonMark, ordered tags, published related projects, content-aligned metadata and canonical URLs, accessible route states, and 404 behavior for drafts, kind mismatches, unknown slugs, and malformed slugs.
- PostgreSQL 16.14 runs as a project-local `linux/arm64` Docker service on the development Mac. It binds to localhost port 5433 so the existing Homebrew PostgreSQL 16 service on port 5432 remains untouched.
- The isolated `chanq_page` and `chanq_page_test` databases use the same two committed Drizzle migrations. The physical schema contains posts, projects, skills, tags, and their three relationship tables. Every post has one explicit `article` or `retrospective` kind; the owning Blog or Retrospectives detail URL is its sole canonical URL.
- Zod validates database URLs, `.env.example` contains safe placeholders, and the actual `.env.local` remains ignored.
- Status, isolated migration-history/upgrade, and transactional schema-check scripts report container, migration, table, classification, constraint, relationship, and cascade health without printing credentials.
- Local migrations and administration use the `root` database role, while isolated least-privilege application roles own routine development and test DML; permission checks cover DDL denial, migration-ledger denial, and cross-database isolation.
- Deterministic development seed rows use fixed identities, timestamps, and a reserved namespace without replacing developer-authored rows. The isolated test database resets to separate synthetic fixtures, and integration checks prove repeat stability, reset recovery, and cross-environment marker isolation.
- Prettier, Vitest, React Testing Library, DOM matchers, and Playwright provide deterministic formatting, unit/component, and production-like browser smoke-test entry points.
- The default repository check enforces formatting, linting, type checking, unit/component tests, migration consistency, and the production build without starting Docker or a browser.
- The approved topology assigns development and production to separate Apple Silicon Macs; production will run pinned `linux/arm64` containers on macOS when infrastructure is scaffolded.
- Schema promotion uses committed migrations, content promotion uses the validated import path, and logical backups are limited to initial bootstrap or disaster recovery.
- Project, skill, and post read repositories validate database rows, translate adapter failures into project-owned errors, share one runtime connection pool, and run through the least-privilege application role. PostgreSQL integration and production-server browser checks cover the dynamic public slices. Production PostgreSQL, validated content imports, backup automation, and restore verification have not yet been implemented.

The ordered queue of unfinished development and local validation work is maintained only in `project-roadmap.md`. Production operations remain documented separately and are intentionally excluded from that queue.

## Documentation ownership

| Area | Question answered | Update trigger |
|---|---|---|
| `product/` | What must the product do? | Scope or acceptance criteria change |
| `architecture/` | How is the current system divided? | Boundaries, dependencies, or data flow change |
| `architecture/decisions/` | Why was a durable choice made? | A cross-cutting or costly-to-reverse decision is accepted |
| `development/` | How do contributors make changes? | Tooling or workflow changes |
| `operations/` | How is the system run and recovered? | Runtime, deployment, networking, or recovery changes |

When a document is added, moved, superseded, or removed, update this index in the same change.
