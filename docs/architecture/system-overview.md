# System Overview

## Status

The current repository contains a project harness, documentation, scoped agent instructions, reusable Codex skills, and validation scripts. It does not yet contain a running Next.js application or production infrastructure configuration.

## Target MVP context

```text
Public visitor
  -> Cloudflare DNS and edge HTTPS
  -> Origin ingress selected for the deployment environment
  -> Next.js container
  -> Versioned MDX or typed local content
```

For a self-hosted origin, ingress may later be `cloudflared -> Next.js` or `cloudflared -> Nginx -> Next.js`. Nginx is not a mandatory hop. PostgreSQL is not part of the MVP content path.

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
| `content/` | Versioned portfolio and article source content | Runtime secrets or executable application logic |
| `infrastructure/` | Docker, ingress, tunnel, and database configuration | Domain policy |
| `tests/` | Cross-boundary and executable verification | Production implementation imported only for test convenience |

## Rendering policy

- Render public, stable pages statically.
- Generate project detail pages statically from validated content.
- Use revalidation for blog indexes and articles only after a freshness target is defined.
- Use dynamic rendering for authenticated previews or truly request-specific data.
- Keep secret-bearing writes in server-only entry points with server-side validation.

For each route, document when HTML is generated, when data is read, what is cached, acceptable staleness, and invalidation ownership.

## Trust boundaries

Treat browser input, route params, MDX frontmatter, environment variables, HTTP responses, database rows, proxy headers, and tunnel configuration as untrusted. Validate at the first project-owned boundary and pass typed values inward.

## Caching boundaries

Browser, Cloudflare, Nginx, Next.js, and PostgreSQL caching are independent. Introduce one cache layer at a time, define its source of truth and stale-data budget, then verify hit, miss, refresh, and purge behavior before adding another.

## Planned evolution

1. Scaffold the static Next.js shell and local content pipeline.
2. Complete content, accessibility, SEO, tests, and Docker packaging.
3. Choose the simplest production ingress that meets the hosting environment.
4. Add PostgreSQL and an API only after a documented adoption gate is met.
5. Preserve public URLs and metadata during any content-source migration.
