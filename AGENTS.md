# Repository Instructions

## Purpose

Build a personal developer portfolio that demonstrates real project experience, problem solving, technical decisions, frontend quality, and production awareness. Optimize for clear content and credible evidence before visual novelty or architectural complexity.

## Visual direction

- Maintain a developer-focused code-editor atmosphere across the public site.
- Use the Dracula palette as the canonical color foundation: background `#282a36`, gray `#44475a`, white `#f8f8f2`, green `#50fa7b`, orange `#ffb86c`, pink `#ff79c6`, purple `#bd93f9`, red `#ff5555`, yellow `#f1fa8c`, and cyan `#8be9fd`.
- Keep raw Dracula values centralized in `src/app/globals.css` and map components through semantic color tokens. Do not scatter palette literals through route or feature components.
- Use the self-hosted D2Coding font for body and code text, and reserve NeoDunggeunmo Code for title typography, with monospace fallbacks. Keep the pinned font files and their SIL Open Font Licenses together under `src/app/fonts/`; treat a version change as a reviewed asset update.
- Preserve readable type sizes and line heights, sufficient contrast, visible focus, reduced-motion behavior, and non-color cues while expressing the editor-inspired visual direction.

These instructions apply to the entire repository. Before editing a file, also read every `AGENTS.md` from the repository root down to that file's directory. The nearest file adds or narrows instructions for its scope. Do not copy root rules into child files unless the local context needs a more specific constraint.

## Instruction boundaries

Maintain `AGENTS.md` files only at these architectural boundaries:

- `/AGENTS.md`
- `/docs/AGENTS.md`
- `/src/app/AGENTS.md`
- `/src/features/AGENTS.md`
- `/src/shared/AGENTS.md`
- `/content/AGENTS.md`
- `/infrastructure/AGENTS.md`
- `/tests/AGENTS.md`
- `/scripts/AGENTS.md`
- `/.agents/skills/AGENTS.md`

Every descendant directory inherits the nearest applicable boundary instructions. Do not add an `AGENTS.md` to route segments, individual features, content categories, infrastructure components, test types, skill packages, metadata directories, or other leaf directories unless this boundary policy is intentionally revised first. Keep boundary rules cohesive and use headings inside the boundary file for narrower cases.

## Source-of-truth order

Use this order when project information conflicts:

1. The user's current request and explicit acceptance criteria.
2. This root file and the nearest scoped `AGENTS.md` files.
3. Accepted records in `docs/architecture/decisions/`.
4. Current-state documentation linked from `docs/index.md`.
5. `portfolio-project-plan.md`, which is the original plan and product rationale.
6. Existing implementation and tests, which may reveal undocumented drift.

Do not silently resolve a meaningful conflict. Preserve evidence, explain the conflict, and update the appropriate source of truth as part of the change.

## Required task workflow

1. Read `docs/index.md`, the relevant documentation, and all applicable `AGENTS.md` files.
2. Inspect the current implementation, tests, configuration, and Git diff before proposing edits.
3. Restate the requested outcome as observable acceptance criteria.
4. Identify the smallest coherent change and its affected architectural boundary.
5. Record a plan for changes that span multiple files, boundaries, or deployment components.
6. Implement one reviewable vertical slice at a time.
7. Add or update tests for behavior changes and regression risks.
8. Update current-state docs and add an ADR when a durable architectural decision changes.
9. Run `./scripts/check.sh` plus the narrowest relevant runtime tests.
10. Report files changed, checks actually run, results, assumptions, and remaining risks.

Never claim that a command, test, build, migration, or deployment succeeded unless it was run and its output was checked.

## MVP boundaries

- Use Next.js App Router with strict TypeScript.
- Prefer Server Components and static rendering. Add Client Components or dynamic rendering only for documented interaction or freshness requirements.
- Use PostgreSQL as the MVP source of truth for projects, developer skills, and blog posts. Store trusted content bodies as Markdown text, not executable MDX.
- Support the approved [detail content authoring policy](docs/development/content-authoring.md): selected-text emphasis and ordered sections with still images, controlled GIFs, and links. Keep raw HTML disabled; media insertion does not authorize an upload system, arbitrary CSS, or executable embeds. Distinguish planned controls from implemented behavior.
- Include versioned schema migrations, development and test seeds, repository adapters, an internal content CLI or import path, and documented production backup and restore procedures.
- Keep PostgreSQL private. Do not add a public write API, admin UI, admin authentication, image upload system, or multi-user permissions during the MVP.
- Keep the public portfolio indexable. Do not place public pages behind Cloudflare Access or another authentication gateway.
- Exclude authentication, comments, likes, view counters, complex search, a full CMS, content revision history, a React Native application, and multi-server infrastructure from the MVP unless the product scope is explicitly changed.

## Architecture rules

Use a feature-first, proportional form of Clean Architecture:

- `src/app/` owns Next.js routes, layouts, metadata, route handlers, and dependency composition.
- `src/features/` owns business capabilities. A feature may contain `domain`, `application`, `infrastructure`, and `presentation` folders when those boundaries solve a current problem.
- `src/shared/` owns stable, feature-neutral primitives. It must not become a miscellaneous dumping ground.
- Inner business code must not import Next.js, database clients, HTTP clients, or UI frameworks.
- Outer layers may depend inward; inner layers must never depend outward.
- Keep simple read-only content paths simple. Do not create interfaces, repositories, use cases, or dependency injection containers without at least two implementations, a meaningful test seam, or a documented volatility boundary.
- Keep framework-specific types at adapters and entry points. Translate them into project-owned types before passing data inward.
- Define project-owned repository ports for database-backed content capabilities and implement them in PostgreSQL infrastructure adapters. Do not expose ORM types beyond the adapter boundary.

Favor cohesive modules and explicit data flow over global state, service locators, and cross-feature imports.

## Coding standards

- Write repository files, code identifiers, comments, documentation, commit messages, and user-facing fallback copy in English.
- Use strict TypeScript. Avoid `any`; validate unknown input at trust boundaries.
- Prefer named domain types and small pure functions for business rules.
- Keep React components focused on rendering and interaction orchestration.
- Treat URL params, headers, cookies, forms, environment variables, external APIs, Markdown import metadata, and database rows as untrusted input.
- Use comments to explain intent, constraints, tradeoffs, or non-obvious failure modes. Do not narrate self-evident syntax.
- Preserve accessibility: semantic HTML, keyboard operation, visible focus, useful alternative text, sufficient contrast, and reduced-motion behavior.
- Preserve SEO: stable URLs, accurate metadata, canonical URLs, structured data that matches visible content, and correct status codes.
- Do not add a dependency when the platform or a small local function adequately solves the problem. Document the reason for consequential dependencies.

## Security and operations

- Never commit secrets, real credentials, private keys, tunnel tokens, production database URLs, or personal data.
- Treat the Apple Silicon development Mac and separate Apple Silicon production Mac as distinct trust, credential, data, and failure boundaries; verify production images for `linux/arm64`.
- Provide `.env.example` entries with safe placeholders when configuration is introduced.
- Bind PostgreSQL and internal tools to private Docker networks by default.
- Validate and normalize input at every external boundary; authorize sensitive server actions independently of UI visibility.
- Make migrations backward-aware, reviewable, and backed up before destructive production changes.
- Treat applied migrations as immutable, run production migrations as an explicit release step, and verify backup and restore before production content becomes irreplaceable.
- Promote schema with committed migrations and content through the validated import path. Never copy PostgreSQL data directories or Docker volumes between hosts.
- Limit `pg_dump` custom-format logical backups to a verified one-time initial bootstrap or disaster recovery, and use `pg_restore` against an isolated database first; after launch, recovery backups originate from production.
- Prefer read-only inspection before infrastructure mutation. Do not deploy, purge caches, rotate credentials, or alter DNS without explicit authorization.
- Keep Cloudflare, Next.js, browser, and any Nginx caching policies independently documented and testable.

## Validation expectations

Always run:

```bash
./scripts/check.sh
```

When application tooling exists, also run the applicable project scripts for formatting, linting, type checking, unit tests, integration tests, end-to-end tests, and production builds. Choose validation proportional to risk, but do not skip a cheaper relevant check.

## Documentation rules

- `docs/index.md` is the documentation entry point and must link to every maintained document.
- Product docs describe user value and acceptance criteria, not implementation guesses.
- Architecture docs describe current system boundaries and data flow.
- ADRs record durable decisions, alternatives, consequences, and status.
- Development docs explain repeatable contributor workflows.
- Operations docs contain safe, verifiable runbooks and recovery notes.
- Update docs in the same change when behavior, commands, architecture, configuration, or operating procedures change.

## Definition of done

A change is complete only when its acceptance criteria are met, architecture boundaries remain valid, relevant tests pass, documentation is current, no secrets or generated artifacts were introduced, and the handoff names any unverified assumption or remaining risk.
