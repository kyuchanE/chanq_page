---
name: validate-project-change
description: Validate repository changes with risk-based static checks, tests, builds, documentation review, architecture-boundary review, accessibility, SEO, security, and operational checks. Use before handoff, review, release, or after changes to Next.js behavior, content, dependencies, PostgreSQL, Docker, Nginx, Cloudflare, scripts, AGENTS.md files, skills, or project documentation.
---

# Validate Project Change

Produce evidence about what works, what failed, what was not checked, and what risk remains. Do not modify implementation unless the user also requested fixes.

## Procedure

1. Read applicable `AGENTS.md` files and use `docs/index.md` to identify expected behavior and architectural rules.
2. Inspect Git status and the complete relevant diff. Separate user changes from the change under validation.
3. Classify risk: behavior, types, data, security, accessibility, SEO, rendering and caching, infrastructure, migration, or documentation.
4. Run `./scripts/check.sh` first. Then run the narrowest relevant formatting, lint, type-check, unit, integration, end-to-end, and production-build commands that exist.
5. Inspect test quality and uncovered behavior. A passing test is evidence only for what it actually asserts.
6. Check dependency direction: App Router composes features, outer adapters depend inward, shared code remains feature-neutral, and inner code contains no framework imports.
7. For public UI, check semantic structure, keyboard access, focus, alternative text, contrast assumptions, responsive behavior, reduced motion, metadata, canonical URLs, structured data consistency, statuses, and indexability.
8. For boundaries, check validation, authorization, secret handling, safe logging, error translation, timeouts, and failure behavior.
9. For infrastructure, render or validate configuration, inspect public ports and networks, verify health checks, and review rollback, backup, restore, and cache invalidation implications.
10. Compare docs and ADRs with the implemented state. Report drift as a finding.

## Reporting

Lead with the overall result. List findings by severity with file and evidence. Then list commands run and exact outcomes, unavailable or skipped checks with reasons, assumptions, and remaining risks.

Never convert an unavailable check into a pass. Never claim deployment, browser, database, tunnel, or production behavior was verified from static inspection alone.
