# System Overview

## Status

The current repository contains a project harness, documentation, scoped agent instructions, reusable Codex skills, validation scripts, a minimal runnable Next.js App Router application, and a local PostgreSQL foundation. It exposes static placeholder routes for the seven MVP sections. PostgreSQL 16.14 runs locally in Docker with isolated development and test databases, a typed Drizzle schema, a committed initial migration, and transactional schema checks. Completed portfolio features, repository adapters, application tests, and production infrastructure are not yet implemented.

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
| `/projects` | Projects | `src/app/projects/page.tsx` |
| `/retrospectives` | Retrospectives | `src/app/retrospectives/page.tsx` |
| `/blog` | Blog | `src/app/blog/page.tsx` |
| `/contact` | Contact | `src/app/contact/page.tsx` |

Each route is currently a static Server Component with semantic placeholder content and accurate page metadata. Dynamic detail routes, feature presentation modules, and data access remain planned.

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

## Trust boundaries

Treat browser input, route params, Markdown import metadata, environment variables, HTTP responses, database rows, proxy headers, and tunnel configuration as untrusted. Validate at the first project-owned boundary and pass typed values inward.

## Caching boundaries

Browser, Cloudflare, Nginx, Next.js, and PostgreSQL caching are independent. Introduce one cache layer at a time, define its source of truth and stale-data budget, then verify hit, miss, refresh, and purge behavior before adding another.

## Planned evolution

1. Add deterministic development and test seeds to the implemented local PostgreSQL and migration foundation.
2. Deliver the first database-backed public vertical slice through application ports and a PostgreSQL adapter.
3. Complete the validated content import, accessibility, SEO, unit and integration tests, `linux/arm64` Docker packaging, migration release steps, logical backup, and isolated restore verification.
4. Add Nginx and Cloudflare Tunnel with separately verified responsibilities and no initial origin HTML cache.
