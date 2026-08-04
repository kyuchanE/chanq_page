# ADR-0003: Use PostgreSQL for MVP Content

## Status

Accepted

Supersedes [ADR-0001](0001-use-local-mdx-for-mvp-content.md).

## Context

The portfolio will receive ongoing project case studies, developer skill evidence, and blog posts. Establishing the runtime content model after the application is complete would require migrating URLs, publication state, SEO fields, relations, repository boundaries, caching, tests, and deployment operations at the same time.

PostgreSQL introduces schema, migration, connection, backup, and failure-management work earlier. That cost is accepted because ongoing structured content is now part of the MVP requirement, the project is intended to demonstrate production-aware database work, and the database boundary can support later read APIs without replacing a file-only runtime source.

## Decision

Use PostgreSQL as the sole MVP runtime source of truth for projects, developer skills, and blog posts.

- Store long-form bodies as Markdown text and render them through controlled components. Do not execute database-provided MDX or arbitrary React components.
- Represent draft and published states, stable unique slugs, publication timestamps, SEO metadata, tags, and project-skill relations explicitly.
- Access public content through project-owned repository ports implemented by PostgreSQL infrastructure adapters.
- Use Drizzle ORM with a PostgreSQL driver for typed access and Drizzle Kit for reviewed SQL migration generation and application.
- Validate environment values, import inputs, and external database rows at project-owned boundaries with Zod schemas.
- Use separate development and test seeds. Keep production content out of automatic development seed flows.
- Perform production migrations as an explicit release step, not automatically on every application startup.
- Provide an internal server-only CLI or import use case for MVP writes.
- Define backup retention, restore, and restore-test procedures before accepting irreplaceable production content.

## Alternatives considered

- **Keep local MDX for the MVP:** rejected because it defers the now-required database model and repository integration, creating a coordinated content migration later.
- **Use Git-authored Markdown as the source and PostgreSQL as a synchronized read model:** rejected because two authoritative stores introduce synchronization drift and unclear recovery ownership.
- **Build an administrator UI immediately:** rejected because authentication, authorization, image upload, and browser editing would expand the MVP beyond its public portfolio objective.
- **Use a generic polymorphic content table:** rejected because posts, projects, and developer skills have different invariants and relations that deserve explicit schemas.

## Consequences

- Local and production runtime environments require PostgreSQL availability.
- Docker image builds must remain independent of production database access.
- Content writes require a controlled CLI or import workflow until a future administration feature is approved.
- Database migrations, seeds, repository integration tests, backup, and restore become MVP quality gates.
- Public URLs and SEO metadata can remain stable as content volume grows or read APIs are introduced.
- Operational complexity and initial delivery time increase relative to the former file-only plan.

## Revisit when

Revisit the write workflow when browser-based editing, content revisions, image upload, multiple administrators, or a React Native read API becomes an approved product requirement. PostgreSQL remains the source of truth unless a new ADR explicitly replaces it.
