# System Overview

## Status

The current repository contains a project harness, documentation, scoped agent instructions, reusable Codex skills, validation scripts, a runnable Next.js App Router application with a shared public presentation foundation, and a local PostgreSQL foundation. Home composes published content highlights, while About and Contact provide static profile and sample contact experiences. Projects is a dynamic PostgreSQL-backed list and detail experience with validated public read models, controlled Markdown, visible skill relations, metadata, explicit loading/empty/recoverable-error states, and project-specific not-found behavior. Skills is a dynamic PostgreSQL-backed evidence view with deterministic grouping and published-project-only relations. Blog and Retrospectives are dynamic PostgreSQL-backed list and detail experiences over one classified post repository, with controlled Markdown, tags, published project relations, stable canonical metadata, accessible route states, and kind-aware not-found behavior. PostgreSQL 16.14 runs locally in Docker with isolated development and test databases, a typed Drizzle schema, two committed migrations, deterministic development and test data, repository integration checks, and isolated fresh-history and upgrade-path migration checks. Production infrastructure is not yet implemented.

## Current local database boundary

```text
Next.js and Drizzle Kit on the development Mac
  -> postgresql://127.0.0.1:5433
  -> PostgreSQL 16.14 linux/arm64 container
     -> root: bootstrap, migration, reset, and role administration
     -> chanq_page_app: chanq_page development DML only
     -> chanq_page_test_app: chanq_page_test integration DML only
```

The project Compose file binds PostgreSQL to loopback only. Development and test application roles cannot connect to each other's databases or modify the schema. Drizzle uses separate elevated migration URLs. The named volume is local runtime state and is never a deployment or cross-host transfer artifact. A native Homebrew PostgreSQL 16 service may continue using port 5432 independently.

## Current route skeleton

| URL | Section | Route entry point |
|---|---|---|
| `/` | Home | `src/app/page.tsx` |
| `/about` | About | `src/app/about/page.tsx` |
| `/skills` | Skills | `src/app/skills/page.tsx` |
| `/projects` | Published project list | `src/app/projects/(listing)/page.tsx` |
| `/projects/[slug]` | Published project detail | `src/app/projects/[slug]/page.tsx` |
| `/retrospectives` | Published retrospective list | `src/app/retrospectives/(listing)/page.tsx` |
| `/retrospectives/[slug]` | Published retrospective detail | `src/app/retrospectives/[slug]/page.tsx` |
| `/blog` | Published article list | `src/app/blog/(listing)/page.tsx` |
| `/blog/[slug]` | Published article detail | `src/app/blog/[slug]/page.tsx` |
| `/contact` | Contact | `src/app/contact/page.tsx` |

About and Contact are static Server Components. Home, Projects, Skills, Blog, and Retrospectives use dynamic Server Components so the production build remains independent of database connectivity while runtime reads come from PostgreSQL. Their App Router composition shares one connection pool and exposes only project-owned values; PostgreSQL and Drizzle types remain inside infrastructure. URL-neutral `(listing)` groups keep list loading UI from streaming a successful response before a detail route can return not found. The root layout composes one header, primary navigation, main-content, and footer shell. The navigation isolates `usePathname` in a small Client Component so exact and nested section URLs expose a visible `aria-current="page"` state; native links remain keyboard operable. Global CSS owns the color, typography, spacing, width, focus, and motion tokens, responsive breakpoints, skip-link treatment, content presentation, and reduced-motion override.

Blog articles and retrospectives share the `posts` aggregate but have one required, mutually exclusive kind. Article details are owned by `/blog/[slug]`; retrospective details are owned by `/retrospectives/[slug]`. The owning URL is canonical, and draft, unknown, malformed, or mismatched-kind requests return not found. [ADR-0007](decisions/0007-classify-posts-by-kind.md) records this policy.

## Target MVP context

```text
Public visitor
  -> Cloudflare DNS and edge HTTPS
  -> Cloudflare Tunnel
  -> Nginx origin ingress
  -> Next.js container
  -> PostgreSQL on a private Docker network
```

The approved deployment target is a dedicated Apple Silicon Mac running macOS and pinned `linux/arm64` containers through Docker Compose. Nginx owns origin request limits, proxy timeouts, controlled forwarded headers, and health routing. Cloudflare owns public DNS and edge HTTPS. Nginx must not add HTML caching during the initial rollout.

## Environment ownership

| Environment | Host | Owns |
|---|---|---|
| Development | Apple Silicon development Mac | Source changes, development data, migrations, deterministic seeds, content preparation, and local verification |
| Test | Isolated compatible PostgreSQL databases on the development Mac or CI | Fresh migration validation, upgrade tests, repository integration tests, and synthetic fixtures |
| Production | Separate Apple Silicon production Mac | Public containers, production secrets, production data, operational backups, health, and recovery |

The Macs do not share PostgreSQL data directories, Docker volumes, credentials, or environment files. Docker keeps the production services inside a Linux virtualization boundary, so every production image and native dependency must support `linux/arm64`.

## Source boundaries

```text
src/app
  -> src/features
  -> src/shared

src/features/<feature>/presentation
  -> application
  -> domain

src/features/<feature>/infrastructure
  -> application ports and domain types
```

The arrows show allowed compile-time dependencies. The domain does not import application, infrastructure, presentation, React, Next.js, or database packages. Application code coordinates domain behavior through project-owned ports. Infrastructure implements ports. Presentation converts UI or framework input into application input.

Not every feature needs every layer. A static About page can remain a route plus typed content. Add layers when business rules, side effects, independent tests, or interchangeable adapters create a real boundary.

## Directory responsibilities

| Directory | Responsibility | Must not own |
|---|---|---|
| `src/app/` | Next.js routes, layouts, metadata, route handlers, composition | Reusable business rules |
| `src/features/` | Feature behavior and feature-specific UI/adapters | Cross-feature utility dumping ground |
| `src/shared/` | Stable primitives used by multiple features | Feature policy or feature-to-feature orchestration |
| `content/` | Optional reviewed import inputs, development fixtures, and authoring drafts | A second runtime source of truth, secrets, or executable MDX |
| `infrastructure/` | Docker, ingress, tunnel, and database configuration | Domain policy |
| `tests/` | Cross-boundary and executable verification | Production implementation imported only for test convenience |

## Content data flow

```text
Internal content CLI or validated import
  -> application command
  -> project-owned repository port
  -> Drizzle PostgreSQL adapter
  -> PostgreSQL

Public Next.js route
  -> application query
  -> project-owned repository port
  -> Drizzle PostgreSQL adapter
  -> validated domain or read model
  -> rendered public page
```

PostgreSQL is the sole runtime source of truth for projects, developer skills, and blog posts. Database and Drizzle types stop at the infrastructure adapter. Long-form bodies are trusted Markdown rendered through controlled components; database content must not execute arbitrary MDX or React components.

Project and post presentation share `content/presentation/markdown/DetailMarkdown`, with raw HTML skipped, body H1-to-H2 mapping, generated heading anchors, controlled underline, safe links with external-link notices, and local responsive media. The pure domain URL rule checks parsed and percent-decoded destinations before URL normalization. Outer presentation and import adapters use `content/infrastructure/markdown` for the CommonMark/directive tree policy and bounded filesystem inspection; these adapter dependencies do not expose parser, filesystem, database, or framework types inward. Incoming imports reject invalid text or media before transactions, while public rendering independently deactivates unsafe legacy links/directives and replaces invalid or missing media with readable fallback text. Stored snapshot reads permit explicit repair by a reviewed valid import.

[ADR-0009](decisions/0009-use-controlled-detail-markdown.md) approves and the current implementation enforces local PNG/JPEG/static-WebP/GIF assets under `public/media/<content-slug>/`. File headers provide intrinsic dimensions; per-file and unique-body budgets bound input; real paths prevent media-root symlink escape; and GIFs require same-sized static WebP posters. Detail HTML starts with the poster and loads an unoptimized GIF only after explicit Play; Stop and a new reduced-motion preference restore the poster. The [authoring policy](../development/content-authoring.md) owns syntax, budgets, preparation, retention, and verification. The body column and import envelope remain unchanged, PostgreSQL owns narrative/references, and versioned files remain presentation artifacts. No upload endpoint, remote media-fetch service, binary table, or new content store is introduced.

The project slice implements this read path for published lists, featured lists, and detail-by-slug. Infrastructure validates every selected row with Zod before mapping it to project-owned values. Drafts are filtered in the query, visible skill relations are deterministically ordered, and invalid rows or connectivity failures become project-owned repository errors.

The skill slice implements one visible-skill query ordered by category, display order, name, and stable key. It includes narrative evidence and related project titles/slugs only when those projects are published. Hidden skills remain outside public results, and malformed joined rows or connectivity failures become skill-owned repository errors.

The post slice implements kind-scoped published lists ordered by publication time and slug, plus published detail-by-kind-and-slug. Infrastructure validates and groups joined rows, orders tags by name and slug, exposes only published related projects in project display order, and translates malformed rows or connectivity failures into post-owned repository errors. Route composition validates slugs, treats draft, mismatched-kind, unknown, and malformed values as not found, and derives canonical metadata from the same validated post rendered visibly.

Home composes existing project, skill, and post repository ports through a small content application query. It retains repository order for the first two featured projects, selects up to three visible skills with nonempty narrative evidence and published project relations, and merges both post kinds by descending publication time with a stable slug tie-breaker before selecting three. Independent read failures produce section-specific retry notices; successful sections remain visible and are never replaced with invented fallback content. The introduction and contact entry point stream before these reads complete. A native reload link retries the reads even on the same URL. No new client state, repository, schema, or cache is introduced.

The local write path is implemented by `scripts/import-content.mts` and the `content` feature's import surface. The CLI owns file/environment parsing and dependency composition; application behavior owns publication, immutable kind, relation checks, and deterministic planning through a transaction-scoped repository port. Infrastructure validates inputs/rows and implements serializable PostgreSQL transactions, database-enforced read-only dry-run, target identity checks, and atomic writes. It uses the selected local application role and a short-lived pool that closes on exit. Public routes do not import this CLI or read its files. See [local content import](../development/content-import.md) and [ADR-0008](decisions/0008-use-versioned-content-imports.md); production execution remains unimplemented.

## Release data flow

```text
Committed Drizzle migrations
  -> fresh and upgrade-path validation on the development Mac
  -> explicit migration release on the production Mac

Reviewed content input
  -> application validation and repository integration tests
  -> explicit production import with target confirmation

Production PostgreSQL
  -> encrypted `pg_dump` custom-format logical backup
  -> checksum verification and isolated restore test
  -> approved disaster-recovery artifact
```

Do not transfer `/var/lib/postgresql/data`, Docker volumes, or physical database files between the Macs. A sanitized development database may produce a `pg_dump` custom-format logical backup for a one-time initial bootstrap only; after launch, recovery backups originate from production and never overwrite the active database without `pg_restore` verification in an isolated database and explicit cutover authorization.

## Rendering policy

- Render public, stable pages that do not require PostgreSQL statically.
- Keep Docker image builds independent of production database connectivity and credentials.
- Read project, skill, and blog content from PostgreSQL at runtime through server-only repositories.
- Apply explicit server caching or revalidation only after each route has a freshness target and invalidation owner.
- Use dynamic rendering for authenticated previews or truly request-specific data.
- Keep secret-bearing writes in server-only entry points with server-side validation.

For each route, document when HTML is generated, when data is read, what is cached, acceptable staleness, and invalidation ownership.

The current Home, Projects, Skills, Blog, and Retrospectives routes read PostgreSQL for each dynamic server render. No explicit Next.js data cache or revalidation window is configured yet; the accepted staleness is therefore the duration of a single request, and PostgreSQL owns the authoritative value.

## Trust boundaries

Treat browser input, route params, Markdown import metadata, environment variables, HTTP responses, database rows, proxy headers, and tunnel configuration as untrusted. Validate at the first project-owned boundary and pass typed values inward.

## Caching boundaries

Browser, Cloudflare, Nginx, Next.js, and PostgreSQL caching are independent. Introduce one cache layer at a time, define its source of truth and stale-data budget, then verify hit, miss, refresh, and purge behavior before adding another.

## Planned evolution

1. Implement and verify the approved mixed-content policy before cross-site accessibility/SEO/performance checks, owner-reviewed release content, and the clean local rehearsal; follow the ordered [development roadmap](../project-roadmap.md).
2. Complete `linux/arm64` Docker packaging, migration release steps, logical backup, and isolated restore verification when production work is authorized.
3. Add Nginx and Cloudflare Tunnel with separately verified responsibilities and no initial origin HTML cache when production work is authorized.
