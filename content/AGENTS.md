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

## Detail body authoring

- Follow the canonical [detail content authoring policy](../docs/development/content-authoring.md) for projects, articles, and retrospectives. Check its implementation status before using planned syntax or media controls.
- Keep title/summary/SEO metadata separate from the body. Use ordered Markdown sections without a fixed subtitle count; prose, images, GIF demonstrations, and reference/source links may appear wherever they support the explanation.
- Use semantic emphasis and the approved controlled underline syntax, never authored HTML, CSS, MDX, or arbitrary components.
- Manage reviewed media as versioned public assets, not uploads or database binaries. Follow the policy's paths, formats, byte budgets, alternative-text, and GIF-poster requirements.
- Treat public media as publicly accessible even when its referencing record is a draft. Review ownership, redaction, linked destinations, and release asset availability before publication.
- Do not silently rewrite existing author-owned bodies when new validation identifies unsupported syntax or media; report the incompatibility and prepare a reviewed import.

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
