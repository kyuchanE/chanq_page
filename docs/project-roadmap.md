# Project Development Roadmap

## Purpose

Track only unfinished development and local validation work required to produce an MVP release candidate. This is a deletion-based queue: once a work item satisfies every completion condition and its validation evidence has been checked, remove the entire item from this file.

Completed work belongs in the implementation, tests, current-state documentation, Git history, and task handoff—not in this roadmap.

## Scope

This roadmap includes:

- Local development tooling and deterministic quality gates
- Local PostgreSQL permission parity, seeds, fixtures, repositories, and imports
- Home, About, Skills, Projects, Retrospectives, Blog, and Contact behavior
- Controlled detail Markdown, interleaved text/links/media, and reviewed local image/GIF assets
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

The approved three-detail mixed-content workflow is implemented and verified. The next slice applies the complete local application to cross-site quality checks before owner-reviewed release content and the clean rehearsal. Preserve the existing DEV-10, DEV-10A, and DEV-11 identifiers. Synthetic fixtures remain test inputs and do not satisfy the owner-reviewed release-content gate.

### DEV-10 — Cross-site accessibility, SEO, and performance verification

**Status:** `READY`
**Depends on:** None

**Outcome:** The complete local application meets the documented public quality bar and has recorded evidence for remaining limitations.

**Completion conditions:**

- Verify semantic structure, keyboard operation, visible focus, contrast, alternative text, and reduced motion across every primary route and detail template.
- Verify mobile, tablet, desktop, long-content, empty, error, and not-found layouts.
- Include the completed mixed-content fixtures in all three detail types: underlined text versus links, intrinsic image sizing, actual asset loads, GIF play/stop, reduced motion, and no-JavaScript posters. Measure media bytes and layout shift alongside representative detail-page performance.
- Implement and verify page-specific titles, descriptions, canonical URLs, Open Graph data, sitemap, robots rules, and appropriate structured data.
- Close the confirmed baseline gap in project detail canonical metadata: the project route currently supplies title/description/Open Graph fields but no canonical URL, unlike Blog and Retrospectives.
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

### DEV-10A — Owner-reviewed release content

**Status:** `QUEUED`
**Depends on:** DEV-10 and owner-supplied content

**Outcome:** Release content demonstrates real experience and a reachable contact path.

**Completion conditions:**

- Replace the sample project scenarios with at least two owner-reviewed case studies covering problem, alternatives, decision, individual contribution, implementation, evidence, limitations, and next steps.
- Review and publish at least three useful articles or retrospectives; replace synthetic skills with supported claims and published project evidence.
- Apply the verified authoring policy to real bodies and media: review reading order, emphasis, meaningful alternatives, GIF posters/controls, asset rights/redaction, byte budgets, and website/GitHub references. Use media only where it provides real evidence; a synthetic demonstration does not satisfy factual review.
- Replace example contact destinations with owner-confirmed public links and verify them without sending messages.
- Unpublish sample and development-seed writing and hide synthetic skills through the appropriate local content workflows; preserve unrelated author-owned rows and stable real URLs.
- Remove the preview notice only after all publicly visible content and metadata pass factual review.

**Validation:**

- Content schema and import dry-run/apply/repeat validation
- Manual factual, link, and image-alternative review
- Public repository and browser checks against the reviewed local data
- `./scripts/check.sh`

### DEV-11 — Clean local release-candidate rehearsal

**Status:** `QUEUED`  
**Depends on:** DEV-10A

**Outcome:** A contributor can reproduce the complete development result from documented inputs without relying on hidden machine state.

**Completion conditions:**

- Rehearse dependency installation from the committed lockfile.
- Validate safe environment setup from `.env.example` without exposing local credentials.
- Rehearse a fresh isolated PostgreSQL initialization, full migration history, role provisioning, seeds, and validated content import.
- Reproduce versioned media assets and their validation from the clean checkout, including GIF posters and body references; confirm imports and all three detail routes require no untracked local images or remote media fetches.
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
