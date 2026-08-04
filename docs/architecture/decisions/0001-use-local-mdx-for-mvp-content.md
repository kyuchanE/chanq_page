# ADR-0001: Use Local MDX as the MVP Content Source

## Status

Accepted

## Context

The portfolio needs a small set of project case studies and technical articles. Content changes are expected to be infrequent during the MVP, Git history is useful, and public pages benefit from static generation. Browser-based editing, multi-user workflows, and a shared mobile API are not current requirements.

Starting with PostgreSQL would add schema design, migrations, connection management, backups, an API boundary, and production failure modes before those capabilities create user value.

## Decision

Store MVP projects and articles as validated MDX or typed local files. Build public routes from that content and keep URLs independent of physical file paths. Validate frontmatter during development and production builds.

## Alternatives considered

- **PostgreSQL from the start:** rejected for the MVP because its operational and application complexity does not satisfy a current content requirement.
- **Headless CMS:** rejected because it adds an external service and editorial workflow that a single developer does not yet need.
- **Hard-coded React components:** rejected for long-form content because it mixes prose with presentation and makes content conventions harder to validate.

## Consequences

- Content changes are reviewable through Git and work naturally with static generation.
- Publishing requires a repository change and deployment.
- Drafts and browser-based editing remain limited.
- The content loader must validate metadata and keep stable public slugs.
- A future database migration must preserve URLs, dates, metadata, and content semantics.

## Revisit when

Revisit when browser-based editing, draft states, multi-device management, dynamic search or view data, or a shared React Native API becomes a real requirement.
