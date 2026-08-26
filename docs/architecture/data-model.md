# MVP Content Data Model

## Status

Implemented logical and physical MVP foundation. The typed schema is in `src/features/content/infrastructure/postgres/schema.ts`, and the first reviewed SQL migration is in `infrastructure/postgres/migrations/0000_initial_content_schema.sql`.

The migration has been applied to the local development and isolated test databases. Transactional integration checks verify the seven content tables, publication constraints, unique slugs, relationship rows, and cascade deletion behavior. Deterministic development data uses a reserved fixture namespace with fixed identifiers and timestamps; the isolated test database resets to separate synthetic fixtures. Project and skill read repositories are implemented; post repositories and content import behavior remain pending.

## Ownership

PostgreSQL is the sole runtime source of truth. Import files, development fixtures, and test fixtures are inputs to controlled commands, not parallel runtime stores.

Use separate aggregates instead of one polymorphic content table:

```text
posts <-> post_tags <-> tags
posts <-> post_projects <-> projects
projects <-> project_skills <-> skills
```

## Shared conventions

- Use database-generated UUID primary keys.
- Use lowercase, URL-safe, stable slugs with unique constraints.
- Store timestamps as PostgreSQL `timestamptz` in UTC.
- Use explicit `draft` and `published` states.
- Require `published_at` for published content and hide drafts from public repositories.
- Keep `created_at` and `updated_at` on mutable records.
- Store SEO title, SEO description, and optional Open Graph image path explicitly.
- Store long-form content as Markdown `text`.
- Keep static image paths or trusted external URLs as references; do not store uploaded binary images in the MVP.

## Posts

Required concepts:

- `id`, `slug`, `title`, `summary`, and Markdown `body`
- `status`, `published_at`, `created_at`, and `updated_at`
- `seo_title`, `seo_description`, and optional `og_image_path`
- Many-to-many tags through `post_tags`
- Optional related projects through `post_projects`

Index published listing queries by status and publication time. Enforce unique slugs, unique post-tag pairs, and unique post-project pairs.

## Projects

Required concepts:

- `id`, `slug`, `title`, `summary`, and Markdown case-study `body`
- `status`, `featured`, and deterministic display order
- `published_at`, `created_at`, and `updated_at`
- `seo_title`, `seo_description`, and optional `og_image_path`
- Optional repository and live deployment URLs
- Many-to-many developer skills through `project_skills`

Enforce unique slugs, non-duplicated project-skill pairs, and deterministic ordering for featured projects.

## Developer skills

Required concepts:

- `id`, stable `key`, display `name`, category, summary, and evidence text
- Deterministic display order and visibility state
- `created_at` and `updated_at`

Skills represent evidence-backed capabilities, not percentages or ratings. Associate them with projects instead of duplicating proof in multiple rows.

## Tags

Required concepts:

- `id`, stable unique `slug`, and display `name`
- `created_at` and `updated_at`

Do not introduce tag hierarchy, aliases, or full-text search during the MVP.

## Application boundaries

Define public read operations around observable needs, such as published lists, detail by slug, featured projects, and visible skills. Define internal commands for validated create, update, draft, and publish behavior.

Repository ports belong to the owning feature application layer. Drizzle schemas, SQL rows, database errors, and connection objects remain in infrastructure adapters. Translate unique-constraint, not-found, and connectivity failures into project-owned results.

The project repository exposes published-list, featured-list, and published-detail-by-slug reads. Lists sort featured rows first, then use display order, publication time, and slug as deterministic tie-breakers. Detail reads include visible skills ordered by skill display order, name, and key. Unknown and draft slugs return no public value; malformed database rows and connectivity failures are translated at the adapter boundary.

The skill repository exposes one visible-skill list ordered alphabetically by category, then by display order, name, and stable key. Each skill includes its narrative evidence and published related projects ordered by featured state, project display order, publication time, and slug. Non-visible skills and draft project relations remain outside the public read model.

## Deferred model concerns

- Administrator accounts and permissions
- Image upload records or object-storage ownership
- Comments, likes, view counters, and engagement data
- Complex or full-text search
- Content revision history
- Localization
- Scheduled publishing automation
- React Native synchronization state
