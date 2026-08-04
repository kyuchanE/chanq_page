# Current Project Scope

## Product outcome

Create a public developer portfolio that lets a visitor quickly understand the developer's specialization, practical experience, problem-solving method, technical judgment, and contact options.

## Primary audiences

- Recruiters and hiring managers
- Developers and potential collaborators
- Prospective freelance clients
- Readers arriving through technical search queries

## MVP capabilities

- Home, About, Skills, Projects, Blog, and Contact experiences
- Two or three detailed project case studies
- Three to five retrospectives or troubleshooting articles
- Responsive layouts with restrained, purposeful motion
- Accessible keyboard navigation and reduced-motion support
- Page-specific metadata, canonical URLs, sitemap, robots rules, Open Graph data, and appropriate structured data
- Static rendering by default, with revalidation only where content freshness requires it
- PostgreSQL as the source of truth for projects, developer skills, and blog posts
- Markdown text for long-form project and blog content
- Validated environment configuration and database connectivity
- Versioned schema migrations and separate development and test seeds
- Public read repositories with draft and published states, stable slugs, relations, and SEO fields
- An internal CLI or import script for controlled content creation and publication
- Unit tests and PostgreSQL-backed integration tests
- Explicit production migration, backup, restore, retention, and restore-test procedures
- Reproducible Docker build and single-instance deployment
- Public DNS and HTTPS through Cloudflare

## MVP exclusions

- User accounts and application authentication
- Comments, likes, follows, bookmarks, and community features
- Full content administration UI
- Administrator authentication
- Image upload system
- Public write API
- View counters and engagement aggregation
- Complex search
- Multi-user roles and permissions
- Content revision history
- React Native application
- Multi-server architecture
- Advertising at launch

## Definition of done

The MVP is done when:

1. Every primary route works through direct navigation and refresh.
2. At least two projects explain the problem, alternatives, decision, implementation, evidence, limitations, and next steps.
3. At least three useful articles or retrospectives are published.
4. Mobile, tablet, desktop, keyboard, focus, contrast, image alternatives, and reduced motion are verified.
5. Metadata, canonical URLs, sitemap, robots rules, Open Graph data, structured data, 404 behavior, and indexability are verified.
6. The production image builds and the application runs through Docker Compose on the intended domain with HTTPS.
7. PostgreSQL starts privately, migrations apply explicitly, development and test seeds are reproducible, and repository integration tests pass against a compatible database.
8. Projects, skills, and blog posts can be created or updated through the validated internal CLI or import path without direct ad hoc production SQL.
9. A production backup can be created, verified, and restored through the documented procedure before irreplaceable content is accepted.
10. Performance and production errors are measured and documented rather than guessed.

## MVP database boundary

PostgreSQL is approved for the MVP because ongoing project, skill, and blog additions are a current requirement and a stable content model will support later read APIs without migrating from a file-only source.

The database boundary does not authorize a public write API, administrator UI, authentication, image upload, engagement features, complex search, revision history, or mobile application. Initial writes go through a server-only internal CLI or import use case. PostgreSQL remains the sole runtime source of truth; import files are inputs, not a second content store.

## Approved infrastructure responsibilities

### Nginx

Include Nginx to own origin request limits, proxy timeouts, controlled forwarded headers, and health routing. Do not enable origin HTML caching during the initial MVP rollout.

### Cloudflare Tunnel

Include Cloudflare Tunnel so the self-hosted origin accepts no direct public inbound connection. Keep public portfolio routes outside Cloudflare Access and document tunnel failure and recovery behavior.

## Remaining adoption gates

### React Native

Adopt only when a mobile-specific capability such as offline reading, notifications, or a personal development log provides value beyond reproducing the website.
