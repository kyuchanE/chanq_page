# System Overview

## Status

The current repository contains a project harness, documentation, scoped agent instructions, reusable Codex skills, and validation scripts. It does not yet contain a running Next.js application or production infrastructure configuration.

## Target MVP context

```text
Public visitor
  -> Cloudflare DNS and edge HTTPS
  -> Cloudflare Tunnel
  -> Nginx origin ingress
  -> Next.js container
  -> PostgreSQL on a private Docker network
```

The approved deployment target is a single self-hosted Linux machine using Docker Compose. Nginx owns origin request limits, proxy timeouts, controlled forwarded headers, and health routing. Cloudflare owns public DNS and edge HTTPS. Nginx must not add HTML caching during the initial rollout.

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

1. Scaffold the Next.js application in a temporary directory and merge it without replacing the repository harness.
2. Add private PostgreSQL, reviewed migrations, separate development and test seeds, and environment validation.
3. Deliver the first database-backed public vertical slice through application ports and a PostgreSQL adapter.
4. Complete content import, accessibility, SEO, unit and integration tests, Docker packaging, migration release steps, backup, and restore verification.
5. Add Nginx and Cloudflare Tunnel with separately verified responsibilities and no initial origin HTML cache.
