# Project Documentation

This page answers three questions for contributors and Codex: **what are we building, what is true now, and why were durable decisions made?**

## Read in this order

1. [`../portfolio-project-plan.md`](../portfolio-project-plan.md) — original product vision, MVP scope, roadmap, and risks.
2. [`product/project-scope.md`](product/project-scope.md) — concise current scope, users, acceptance criteria, and adoption gates.
3. [`architecture/system-overview.md`](architecture/system-overview.md) — current and target boundaries, dependencies, and data flow.
4. [`development/codex-workflow.md`](development/codex-workflow.md) — how to plan, implement, validate, document, and hand off changes.
5. [`operations/deployment-topology.md`](operations/deployment-topology.md) — staged Docker, Nginx, Cloudflare, and PostgreSQL operating model.

## Architecture decisions

- [`ADR-0001: Use Local MDX as the MVP Content Source`](architecture/decisions/0001-use-local-mdx-for-mvp-content.md)
- [`ADR-0002: Use Proportional Feature-First Clean Architecture`](architecture/decisions/0002-use-proportional-feature-first-clean-architecture.md)

## Current project state

The repository is in the **harness and architecture baseline** stage:

- Product direction is documented.
- Root and directory-scoped `AGENTS.md` files define working rules.
- Project-local skills define repeatable Codex workflows.
- Deterministic scripts validate the harness and documentation links.
- Next.js runtime code, package metadata, content, tests, and infrastructure configuration have not yet been scaffolded.

The next recommended milestone is a minimal Next.js App Router shell with strict TypeScript, formatting, linting, unit-test infrastructure, and one static page. PostgreSQL, Nginx, and Cloudflare Tunnel should remain unimplemented until their adoption gates are satisfied.

## Documentation ownership

| Area | Question answered | Update trigger |
|---|---|---|
| `product/` | What must the product do? | Scope or acceptance criteria change |
| `architecture/` | How is the current system divided? | Boundaries, dependencies, or data flow change |
| `architecture/decisions/` | Why was a durable choice made? | A cross-cutting or costly-to-reverse decision is accepted |
| `development/` | How do contributors make changes? | Tooling or workflow changes |
| `operations/` | How is the system run and recovered? | Runtime, deployment, networking, or recovery changes |

When a document is added, moved, superseded, or removed, update this index in the same change.
