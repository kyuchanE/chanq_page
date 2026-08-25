# Project Development Roadmap

## Purpose

Track only unfinished development and local validation work required to produce an MVP release candidate. This is a deletion-based queue: once a work item satisfies every completion condition and its validation evidence has been checked, remove the entire item from this file.

Completed work belongs in the implementation, tests, current-state documentation, Git history, and task handoff—not in this roadmap.

## Scope

This roadmap includes:

- Local development tooling and deterministic quality gates
- Local PostgreSQL permission parity, seeds, fixtures, repositories, and imports
- Home, About, Skills, Projects, Retrospectives, Blog, and Contact behavior
- Accessibility, responsive design, SEO, content quality, and local performance validation
- A clean local release-candidate rehearsal

This roadmap excludes production operations:

- Production Docker Compose, Nginx, Cloudflare Tunnel, DNS, and HTTPS
- Production credentials, role provisioning, migrations, and content execution
- Production backup, retention, restore, monitoring, and incident procedures
- Deployment or changes to the separate production Mac

Those requirements remain authoritative in the product and operations documentation but must be planned separately when production work is authorized.

## Queue rules

1. Work from top to bottom unless a documented blocker changes the order.
2. Keep at most one item `IN_PROGRESS`.
3. Use only these states:
   - `READY`: sufficiently defined and next to start
   - `QUEUED`: ordered but waiting for earlier work
   - `IN_PROGRESS`: actively being implemented
   - `BLOCKED`: cannot proceed without a recorded decision or external change
4. Before moving an item to `IN_PROGRESS`, inspect current code and convert its completion conditions into a task-specific implementation plan.
5. Do not mark an item complete based on implementation alone. Run every listed validation and inspect the output.
6. When all completion conditions and validations pass, update affected current-state docs and remove the item instead of changing its state to `DONE`.
7. Preserve completion evidence in the commit or pull request, test suite, current-state docs, and task handoff.
8. If scope changes, update `docs/product/project-scope.md` first, then reconcile this queue.

## Remaining work

### DEV-05 — Skills PostgreSQL vertical slice

**Status:** `READY`
**Depends on:** None

**Outcome:** Visitors can understand evidence-backed skills and see their relationship to published projects.

**Completion conditions:**

- Define project-owned visible-skill read models and the minimal repository query.
- Implement deterministic category and display ordering.
- Exclude non-visible skills from public reads.
- Render the Skills page without percentages or unsupported proficiency ratings.
- Show project evidence without leaking unpublished projects.
- Reuse the established PostgreSQL adapter and presentation patterns without adding unnecessary layers.

**Validation:**

- Skill mapping and validation tests
- PostgreSQL visibility, ordering, and project-relation integration tests
- Empty-state behavior
- Responsive and keyboard inspection
- Production build
- `./scripts/check.sh`

### DEV-06 — Blog and retrospective classification decision

**Status:** `QUEUED`  
**Depends on:** None

**Outcome:** Blog posts and retrospectives have an explicit, queryable classification and stable URL policy before their repository and routes are implemented.

**Completion conditions:**

- Decide whether retrospectives are a post type, constrained category, or another explicit project-owned concept.
- Define whether one post can appear in both Blog and Retrospectives.
- Define stable detail URL ownership and duplicate-content canonical behavior.
- Update the logical data model and add an ADR if the decision creates a durable cross-cutting boundary.
- Add a forward-only migration if the physical schema changes.
- Preserve existing post identifiers, publication state, slugs, and timestamps.

**Validation:**

- Schema and documentation consistency review
- Drizzle migration consistency check
- Full migration history against an isolated database
- Representative upgrade-path test
- Classification constraint and query tests
- `./scripts/check.sh`

### DEV-07 — Blog and Retrospectives PostgreSQL vertical slices

**Status:** `QUEUED`  
**Depends on:** DEV-05, DEV-06

**Outcome:** Visitors can browse and read published Blog and Retrospective content with tags, related projects, trusted Markdown, and stable metadata.

**Completion conditions:**

- Define project-owned post list/detail read models and minimal repository queries.
- Implement published-only listing and slug-detail behavior for both sections.
- Apply deterministic publication ordering.
- Validate database rows and translate adapter failures at the infrastructure boundary.
- Render trusted Markdown without executable MDX.
- Show tags and only published related projects.
- Return correct not-found behavior for drafts, mismatched classifications, and unknown slugs.
- Generate canonical URLs and visible-content-aligned metadata.

**Validation:**

- Mapping and validation tests
- PostgreSQL classification, publication, ordering, tag, and project-relation tests
- Direct navigation and refresh for both lists, details, and 404 paths
- Canonical and metadata inspection
- Accessibility inspection
- Production build
- `./scripts/check.sh`

### DEV-08 — Validated internal content import

**Status:** `QUEUED`  
**Depends on:** DEV-05, DEV-07

**Outcome:** Projects, skills, posts, tags, and relations can be prepared and verified locally through a controlled import path instead of ad hoc SQL.

**Completion conditions:**

- Define a versioned, documented input format with Zod validation at the file boundary.
- Keep import files as inputs rather than a parallel runtime source of truth.
- Support an explicit local target and a no-write dry-run.
- Provide deterministic idempotency or explicit conflict handling for stable keys and slugs.
- Reject invalid Markdown metadata, missing relations, duplicate identifiers, unexpected publication states, and test/development marker leakage.
- Never publish a draft as an implicit side effect of import.
- Route writes through application behavior and project-owned repository boundaries.
- Produce a useful summary without logging credentials or full sensitive content bodies.
- Keep production execution and production confirmation outside this roadmap.

**Validation:**

- Unit tests for accepted and rejected input
- Dry-run proving zero database writes
- Repeated import with deterministic results
- Transaction rollback on invalid relations or partial failure
- PostgreSQL integration tests using the application role
- Representative CLI failure and exit-code checks
- `./scripts/check.sh`

### DEV-09 — Home, About, Contact, and reviewed MVP content

**Status:** `QUEUED`  
**Depends on:** DEV-08

**Outcome:** The public portfolio communicates specialization, evidence, technical judgment, and a safe contact path using reviewed content rather than placeholders.

**Completion conditions:**

- Implement Home as a concise entry point to featured projects, evidence-backed skills, recent writing, and contact.
- Complete About with relevant experience, working principles, and current focus.
- Complete Contact with explicit, accessible contact links and no public write API or form backend.
- Prepare and import at least two detailed project case studies covering problem, alternatives, decision, implementation, evidence, limitations, and next steps.
- Prepare and import at least three useful articles or retrospectives.
- Review every skill claim and project result for evidence and remove unsupported claims.
- Replace remaining placeholder copy and verify useful empty states where content is optional.
- Use versioned static images with useful alternative text where images add evidence.

**Validation:**

- Content schema and import validation
- Manual factual and link review
- Navigation across all seven primary sections
- Direct navigation and refresh
- Image alternative-text review
- Responsive and keyboard inspection
- Production build
- `./scripts/check.sh`

### DEV-10 — Cross-site accessibility, SEO, and performance verification

**Status:** `QUEUED`  
**Depends on:** DEV-09

**Outcome:** The complete local application meets the documented public quality bar and has recorded evidence for remaining limitations.

**Completion conditions:**

- Verify semantic structure, keyboard operation, visible focus, contrast, alternative text, and reduced motion across every primary route and detail template.
- Verify mobile, tablet, desktop, long-content, empty, error, and not-found layouts.
- Implement and verify page-specific titles, descriptions, canonical URLs, Open Graph data, sitemap, robots rules, and appropriate structured data.
- Ensure structured data matches visible content and public pages remain indexable.
- Verify correct status codes for valid, draft, unknown, and malformed URLs.
- Measure local production-build performance for representative list and detail pages.
- Resolve critical regressions and record any accepted non-critical limitation in current-state documentation.

**Validation:**

- Automated accessibility checks where supported
- Manual keyboard, focus, contrast, alternative-text, and reduced-motion review
- Playwright journeys for primary routes, details, direct URLs, refreshes, and 404 behavior
- Metadata, canonical, sitemap, robots, and structured-data assertions
- Local production performance measurements
- ESLint, type checking, tests, and production build
- `./scripts/check.sh`

### DEV-11 — Clean local release-candidate rehearsal

**Status:** `QUEUED`  
**Depends on:** DEV-10

**Outcome:** A contributor can reproduce the complete development result from documented inputs without relying on hidden machine state.

**Completion conditions:**

- Rehearse dependency installation from the committed lockfile.
- Validate safe environment setup from `.env.example` without exposing local credentials.
- Rehearse a fresh isolated PostgreSQL initialization, full migration history, role provisioning, seeds, and validated content import.
- Run the application against the rebuilt local database using the application role.
- Verify all primary and detail routes through the production build.
- Confirm deterministic checks fail for a representative invalid input or forbidden permission.
- Reconcile implementation, tests, current-state docs, and the MVP development acceptance criteria.
- Confirm no secrets, local database artifacts, reports, or generated runtime output are tracked.

**Validation:**

- Frozen-lockfile installation
- Full local database bootstrap and migration verification
- Unit, component, PostgreSQL integration, and end-to-end suites
- Formatting, ESLint, and type checking
- Production build and production-server browser verification
- `./scripts/check.sh`
- Git status and secret/artifact inspection

## Roadmap completion

When DEV-11 passes, remove it like every other completed item. If no remaining development item exists, remove this document from `docs/index.md` and either delete it or replace it with a newly authorized scope. Production readiness must not be inferred from completion of this development-only roadmap.
