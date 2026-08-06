# Content Instructions

PostgreSQL is the runtime source of truth for public portfolio content. This directory may contain reviewed import inputs, development fixtures, and authoring drafts used by the internal content CLI, but the application must not treat these files as an independent runtime content source.

- Write content in English unless the product scope explicitly introduces localization.
- Validate every import against project-owned schemas and stable explicit slugs before writing to PostgreSQL.
- Store publish and update dates in one documented ISO 8601 convention.
- Keep claims factual and include evidence for results or performance improvements.
- Do not place secrets, private client information, copyrighted material without permission, or unredacted personal data here.
- Keep executable application logic out of content files.
- Preserve public URLs when moving or restructuring source files.
- Store long-form bodies as Markdown. Do not import executable MDX or arbitrary React components from database content.
- Keep development and test fixtures separate from production imports, and make import or seed operations idempotent where practical.
- Treat reviewed production import inputs as content-promotion artifacts; never substitute a development database or its backup for routine content promotion.
- Require dry-run validation, explicit production targeting, and deterministic conflict handling before a production import.

## Blog articles

- Explain a concrete problem through context, environment, symptoms, root cause, failed approaches where useful, final solution, verification, limitations, and reusable lessons.
- Use problem-oriented titles and provide validated summaries, tags, dates, and related project links.
- Mark code languages and keep examples minimal, safe, and tested when practical.
- Use the internal CLI or import application use case for create, update, draft, and publish operations; do not modify production rows with ad hoc SQL.

## Project case studies

- Cover objective, responsibilities, constraints, alternatives, decision rationale, implementation, trials, results, limitations, and future improvements.
- Distinguish individual contribution from team outcomes.
- Link technologies to concrete work instead of proficiency percentages or logo collections.
- Use measurable results only when the measurement method can be explained.
- Redact private company, client, repository, and production information.
- Associate projects with developer skills through explicit validated relations rather than duplicating skill data in content bodies.
