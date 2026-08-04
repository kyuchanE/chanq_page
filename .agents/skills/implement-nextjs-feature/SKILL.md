---
name: implement-nextjs-feature
description: Implement a documented Next.js App Router feature as a small vertical slice using strict TypeScript, Server Components by default, proportional feature-first Clean Architecture, boundary validation, tests, and synchronized documentation. Use for pages, layouts, metadata, route handlers, server actions, PostgreSQL-backed Markdown content flows, feature UI, application behavior, adapters, and related bug fixes in this portfolio repository.
---

# Implement Next.js Feature

Deliver the smallest complete behavior that satisfies documented acceptance criteria and repository boundaries.

## Procedure

1. Read the root and scoped `AGENTS.md` files, `docs/index.md`, product scope, system overview, relevant ADRs, current files, tests, and Git diff.
2. Confirm observable acceptance criteria and the rendering or freshness requirement. Use `$plan-project-change` first when the change crosses boundaries or contains a durable choice.
3. Select the feature owner. Keep route entry points and composition in `src/app/`; keep feature behavior in `src/features/<feature>`; move code to `src/shared/` only when it is stable and feature-neutral.
4. Start with the simplest design. Add `domain`, `application`, `infrastructure`, or `presentation` layers only when a current rule, side effect, adapter, or independent test seam needs them.
5. Define project-owned input and result types. Validate route params, forms, content frontmatter, environment values, responses, and persistence data at their first trusted boundary.
6. Implement pure rules before adapters. Keep inner code free of React, Next.js, database clients, HTTP clients, and environment access.
7. Compose dependencies at a Next.js server entry point. Use a Server Component by default and add the smallest possible Client Component only for browser interaction.
8. Provide semantic HTML, keyboard behavior, visible focus, useful alternatives, responsive layout, reduced motion, correct status handling, and honest metadata.
9. Add focused tests for rules and regressions, integration tests for meaningful boundaries, and an end-to-end test only for a critical visitor journey.
10. Update current-state docs and add an ADR for a durable decision. Run `./scripts/check.sh`, relevant package quality gates, and a production build when routing, rendering, or deployment output changes.

## Guardrails

- Do not add PostgreSQL, Nginx, Cloudflare Tunnel, authentication, global state, or a client-side data library merely to demonstrate a technology.
- Do not hide a server-side security requirement in UI logic.
- Do not duplicate a framework type throughout inner layers.
- Do not claim performance, accessibility, or SEO success without running an appropriate check.
- Preserve stable public URLs and visible-content consistency during content changes.

## Handoff

Report the behavior delivered, boundaries chosen, files changed, commands and results, documentation updates, assumptions, and remaining risks.
