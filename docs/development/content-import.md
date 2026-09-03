# Local Content Import

## Current scope

The internal TypeScript CLI validates reviewed JSON inputs and imports projects, skills, posts, tags, and relations into the local PostgreSQL application database. PostgreSQL remains the sole runtime source of truth. Files are explicit authoring inputs; the web application never reads them at runtime.

Only the development Mac's `development` and isolated `test` targets are supported. This command does not provision roles, migrate schemas, accept a production target, or expose a public write API. Production execution and confirmation remain future operations work.

The versioned format and update policy are recorded in [ADR-0008](../architecture/decisions/0008-use-versioned-content-imports.md).

## Prerequisites and commands

Install dependencies from the lockfile and complete the [local PostgreSQL setup](../operations/postgresql-lifecycle.md#first-time-setup). Confirm `pnpm db:status` reports a healthy PostgreSQL 16.14 container, two applied migrations, and the isolated application roles.

```bash
pnpm content:import --help
pnpm content:import --target development --file content/examples/local-draft.json --dry-run
pnpm content:import --target development --file content/examples/local-draft.json --apply
```

The [draft example](../../content/examples/local-draft.json) has unpublished writing and a hidden synthetic skill. Applying it creates example rows in the selected database; omit `--apply` when only reviewing the format. Replace example copy and identities with reviewed content before preparing actual portfolio material.

Both the input path and `.env.local` resolve from the repository root. Absolute input paths also work. The script derives that root from its own location. `tsx` is a pinned development dependency used to execute the TypeScript entry point without maintaining a second compiled CLI or raising the Node.js baseline. Type checking remains part of `scripts/check.sh`.

An omitted mode defaults to `--dry-run`; `--apply` explicitly confirms local writes. The two flags cannot be combined. Unsupported, repeated, and positional arguments fail with exit code 2. The selected URL must use `127.0.0.1`, the configured `POSTGRES_PORT` (default `5433`), and the exact database/application role:

| Target | Environment variable | Database | Role |
|---|---|---|---|
| `development` | `DATABASE_URL` | `chanq_page` | `chanq_page_app` |
| `test` | `TEST_DATABASE_URL` | `chanq_page_test` | `chanq_page_test_app` |

URL query parameters and fragments are rejected to prevent connection overrides. The transaction checks the connected database, current/session role, and absence of superuser privileges independently. These checks protect the documented local configuration; a manually configured port forward is outside this workflow.

## Local portfolio preview

The owner-authorized [portfolio preview](../../content/examples/portfolio-preview.json) is generated test data: two fictional project scenarios, two sample articles, one sample retrospective, four skill examples, and four tags. It uses stable `sample-` identities outside the reserved seed namespaces. All case studies and posts label their narrative and proposed verification as fictional; they do not claim measured results. No screenshots are invented as implementation evidence, and `ogImagePath` is null throughout.

```bash
pnpm content:import --target development --file content/examples/portfolio-preview.json --dry-run --allow-publish
pnpm content:import --target development --file content/examples/portfolio-preview.json --apply --allow-publish
pnpm content:import --target development --file content/examples/portfolio-preview.json --apply --allow-publish
```

On a database without these identities, preview and first apply report 4 skills, 4 tags, 2 projects, and 3 posts created. The second apply reports those counts as unchanged, with zero creates or updates. Existing developer-authored and seed rows remain untouched. Existing visible development seeds may therefore appear alongside the samples; no seed namespace is hidden in public queries.

The static Contact page uses the labeled `hello@example.com` and `https://example.com` example destinations. Do not treat them as a real inbox or professional profile, and do not send a test message. The shared shell identifies the site as a content preview.

The production-server browser suite imports this exact input into the isolated test database through the application importer, checks preview/apply/repeat behavior and public navigation, and removes only those test sample identities afterward. It does not modify development content. Component and application tests cover empty sections, missing project evidence, deterministic limits and ordering, and partial read failures.

Local preview verification passed with 89 unit/component tests and 16 production-server Playwright journeys, including all seven primary sections, the five sample detail URLs, mobile/tablet/desktop layouts, heading order, keyboard focus and activation, and existing 404 behavior. Manual development-database inspection covered desktop Home, mobile Home/About/Contact, the visible sample labels, and keyboard skip navigation. No image was added: there is no genuine screenshot evidence for these fictional scenarios. These checks do not establish production readiness or factual professional results. The example email link was checked without launching or sending a message. External `https://example.com` availability could not be verified because DNS resolution timed out in this environment, including a retry outside the sandbox; its destination is a reserved sample, not an owner contact.

Before release, follow the owner-reviewed content item in the roadmap. Prepare real content as a separate reviewed input. To withdraw preview writing, copy the preview input to a temporary reviewed file, set every project/post to `status: "draft"` with `publishedAt: null`, and set each sample skill to `visible: false`; then preview and apply that file to the intended local target. Do not remove unrelated rows or use a fixture reset on the development database. Remove the shell notice and replace Contact's example links only after reviewing all remaining public content. These changes do not constitute production deployment.

## Version 1 format

Use one UTF-8 JSON file no larger than 2 MiB. The root object requires `version: 1` and four arrays: `skills`, `tags`, `projects`, and `posts`. Empty arrays are valid. Each array permits at most 1,000 records. Unknown fields, client-supplied UUIDs/audit timestamps, invalid versions, and duplicate identities within a collection are rejected.

All fields below are required, including nullable fields and relation arrays. Slugs and keys are lowercase ASCII letters/digits separated by single hyphens, at most 100 characters to match the public read contracts, and cannot change an existing identity. Different aggregate types may share a slug; post slugs are unique across articles and retrospectives.

| Record | Required fields |
|---|---|
| Skill | `key`, `name`, `category`, `summary`, `evidence`, `displayOrder`, `visible` |
| Tag | `slug`, `name` |
| Project | Common writing fields, `featured`, `displayOrder`, `repositoryUrl`, `liveUrl`, `skillKeys` |
| Post | Common writing fields, `kind`, `tagSlugs`, `projectSlugs` |

Common writing fields are `slug`, `title`, `summary`, `body`, `status`, `publishedAt`, `seoTitle`, `seoDescription`, and `ogImagePath`.

- Text fields are trimmed, nonempty, and limited to 2,000 characters; Markdown bodies allow 200,000 characters. NUL characters are rejected.
- `body` is plain Markdown text. Keep metadata in the JSON fields, without YAML frontmatter at the start of the body. Markdown is never executed as MDX or loaded as a module; the existing controlled renderer disables raw HTML.
- `status` must explicitly be `draft` or `published`. Drafts require `publishedAt: null`. Published records require a UTC ISO 8601 timestamp with milliseconds, such as `2025-02-01T00:00:00.000Z`. There is no scheduling state or publication inferred from dates.
- Every post must explicitly choose `article` or `retrospective`. An existing post's kind is immutable through this importer to preserve its URL owner.
- `featured` and `visible` are booleans. `displayOrder` is an integer from 0 to 2,147,483,647.
- `repositoryUrl` and `liveUrl` are `null` or HTTP(S) URLs without embedded credentials.
- `ogImagePath` is `null` or a nonempty application-relative path. Protocol-relative URLs, backslashes, whitespace, query/fragment syntax, and `.`/`..` path segments are rejected. File existence and image alternative text remain part of content review.
- `skillKeys`, `tagSlugs`, and `projectSlugs` are arrays of at most 1,000 distinct stable identifiers. Array order has no semantic meaning; validation sorts these lists.
- Reserved `dev-seed-` and `test-fixture-` markers are rejected anywhere in parsed string content, including references and Markdown bodies. Seeds and test resets retain their separate commands.

Syntax validation cannot verify factual claims, evidence quality, copyright permission, or linked resource availability. Review these before publication.

## Publication and update behavior

Publication requires both `status: "published"` with a valid date in the input and `--allow-publish` when the record is new or currently a draft:

```bash
pnpm content:import --target development --file content/reviewed.json --dry-run --allow-publish
pnpm content:import --target development --file content/reviewed.json --apply --allow-publish
```

`content/reviewed.json` denotes your own reviewed input. Permission to publish never changes a record whose input status is `draft`. Editing already published content does not require renewed publication permission. Explicitly setting `draft` and `publishedAt: null` unpublishes a record. Inspect the input and dry-run before applying changes to visible content.

Stable skill keys and tag/project/post slugs select create or update behavior. UUIDs and `created_at` are database-owned and preserved on update. An unchanged normalized record does not write or advance `updated_at`. Changed records update their supplied fields and advance `updated_at`. A changed slug creates another record; import is not a rename or delete mechanism.

Every supplied project owns its complete `skillKeys` list; every supplied post owns its complete tag and project relation lists. These lists replace that owner's relations, and `[]` clears them. Records omitted from the file, and relations owned by omitted projects/posts, remain untouched. A relation may reference an input record or an already existing database record. Missing references fail the entire operation.

## Transactions, output, and recovery

Dry-run performs validation and planning in a serializable, read-only PostgreSQL transaction. It never calls the write port, and PostgreSQL rejects DML even if the application accidentally attempts it. It uses the same publication, identity, and relation rules as apply.

Apply reloads and validates current state in its own serializable transaction before writing. All base records and owned relations commit together. A constraint or relation failure rolls back prior writes. Concurrent conflicts fail rather than silently overwriting another import; no automatic retry is performed. A dry-run is a preview of its database snapshot, not a reservation for a later apply.

Successful output contains only the local target, mode, and `created`, `updated`, and `unchanged` counts for each aggregate. Relationship-only edits count as an owner update. Output does not include credentials, connection URLs, bodies, raw database errors, or invalid source values.

| Exit code | Meaning | Next action |
|---|---|---|
| `0` | Validation/preview or apply succeeded | Review the counts; unchanged input reports unchanged rows |
| `1` | Database, stored-row validation, or unexpected execution failure | Check local health/permissions and rerun dry-run before retrying |
| `2` | Usage, file, format, or target validation failure | Correct the documented input or target |
| `3` | Missing relation, publication/kind conflict, or concurrent/identity conflict | Review the input and current state; rerun dry-run |

If the connection fails around commit, inspect current state with a new dry-run before retrying: the CLI cannot prove the commit outcome of a lost connection. Reapplying identical content is deterministic. Recover a mistaken content edit by reviewing and importing the intended complete records again; deleted relation lists must be restored explicitly. No content revision history or automatic undo is maintained.

## Validation evidence

```bash
./scripts/check.sh
pnpm db:test:repositories
```

Unit tests cover accepted/rejected metadata, fixture markers, local targeting, explicit publication, and application planning. Application-role PostgreSQL tests cover all aggregates and relationships, database-enforced read-only dry-run with unchanged seven-table snapshots, stable repeated imports including UUIDs/audit timestamps, partial updates, publication/unpublication, immutable kind ownership, and rollback after late relation and real database constraint failures. CLI tests run from outside the repository and check successful dry-run/apply/repeat plus exit codes 1, 2, and 3 without disclosing content or credentials.

The integration command resets only the synthetic test database, runs import and read-repository suites sequentially because they share that database, and cleans up import probe records. It does not import authored development content or run production operations.
