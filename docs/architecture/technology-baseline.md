# Technology Baseline

## Status

Implemented for the initial application scaffold, local PostgreSQL foundation, and application quality-gate foundation. Feature-level testing and production runtime-topology entries remain approved for later vertical slices.

## Resolved scaffold versions

The temporary scaffold resolved and committed these direct package versions on the initial generation:

- Next.js 16.2.12
- React and React DOM 19.2.4
- TypeScript 5.9.3
- Tailwind CSS 4.3.3
- ESLint 9.39.5 with `eslint-config-next` 16.2.12
- React Compiler Babel plugin 1.0.0
- pnpm 11.9.0 with Node.js 20.9.0 or later

The committed lockfile is the dependency-resolution source of truth. Routine compatible upgrades update the manifest, lockfile, and this summary together.

## Resolved local database versions

- PostgreSQL 16.14 on Debian Bookworm as a pinned `linux/arm64` container
- Drizzle ORM 0.45.2
- Drizzle Kit 0.31.10
- `pg` (`node-postgres`) 8.22.0 with `@types/pg` 8.20.3
- Zod 4.4.3
- dotenv 17.4.2 for migration-tool environment loading

## Resolved quality-gate versions

- Prettier 3.9.6
- Vitest 4.1.10
- React Testing Library 16.3.2
- Testing Library DOM matchers 7.0.0
- jsdom 26.1.0
- Playwright Test 1.62.1 with its pinned Chromium build

jsdom is intentionally pinned below its newest major because version 30 requires a newer Node.js baseline than this project's Node.js 20.9 minimum. The committed lockfile remains authoritative for transitive Vite and browser-test dependencies.

## Application scaffold

| Concern | Decision | Reason |
|---|---|---|
| Package manager | pnpm | Use one deterministic lockfile and workspace-ready package management. |
| Language | TypeScript with `strict` enabled | Keep domain, boundary, and configuration contracts explicit. |
| Framework | Next.js App Router | Use Server Components and server entry points by default. |
| Source root | `src/` | Keep application source separate from repository operations and documentation. |
| Import alias | `@/*` | Match the source-root convention without deep relative imports. |
| Linting | ESLint with Next.js rules | Start from the framework-supported linting path. |
| Formatting | Prettier | Keep formatting deterministic and separate from semantic lint rules. |
| Styling | Tailwind CSS with explicit theme tokens | Support responsive delivery while keeping shared visual decisions centralized. |
| React optimization | React Compiler enabled through the scaffold option | Use the current recommended scaffold path and validate generated behavior. |
| Development bundler | Turbopack default | Follow the current Next.js scaffold baseline unless a verified incompatibility appears. |

Generate the application in a temporary directory because this repository already contains `AGENTS.md`, `docs/`, `.agents/`, `scripts/`, and scoped `src/` directories. Use the current official `create-next-app` flags equivalent to:

```text
TypeScript + ESLint + Tailwind CSS + React Compiler + App Router
+ src directory + Turbopack + @/* alias + pnpm + empty template
+ disabled nested Git initialization
```

Review the temporary scaffold before merging. Preserve repository-owned instructions, documentation, scripts, and unrelated user changes.

## Data and validation

| Concern | Decision | Reason |
|---|---|---|
| Runtime source of truth | PostgreSQL | Support structured ongoing projects, skills, and posts from the first vertical slice. |
| Database access | Drizzle ORM with `node-postgres` | Keep SQL and schema intent visible for a long-lived self-hosted Node.js process. |
| Migration tooling | Drizzle Kit with committed SQL migrations | Generate reviewable migrations and apply them explicitly. |
| Local database roles | Elevated migration role plus isolated least-privilege development/test application roles | Detect permission regressions locally without giving routine application code schema privileges. |
| Boundary validation | Zod | Validate environment configuration, import inputs, and untrusted external data with strict TypeScript inference. |
| Long-form content | Markdown text | Avoid runtime execution of database-provided MDX or arbitrary components. |
| MVP write path | Internal server-only CLI or import use case | Add content without approving an admin UI, authentication, or a public write API. |
| Production schema promotion | Committed, reviewed migrations | Keep schema history deterministic instead of restoring a development database during each deployment. |
| Production content promotion | Validated import through application and repository boundaries | Exclude development seeds, test fixtures, roles, and environment-specific database state. |
| Logical backup role | `pg_dump` custom format with `pg_restore` | Limit logical backups to initial bootstrap or disaster recovery and keep them out of the normal schema and content deployment path. |
| Static images | Versioned files under `public/` with database references | Keep image upload and object storage outside the MVP. |

Do not expose Drizzle records or Zod schemas as domain models by default. Translate external data at the infrastructure or input boundary and pass project-owned types inward.

## Testing

| Layer | Tooling | Scope |
|---|---|---|
| Unit and synchronous component | Vitest, React Testing Library, and DOM matchers | Domain rules, application orchestration, validation, synchronous UI behavior, and regressions |
| PostgreSQL integration | Transactional SQL harness now; Vitest against the dedicated database with the repository slice | Migrations and constraints now; repository adapters, transactions, seeds, and import behavior later |
| End-to-end | Playwright | Critical public navigation, project and article reading, direct URLs, 404 behavior, and accessibility-critical interactions |

Do not depend on component unit tests for asynchronous Server Components. Verify those paths through application tests and production-like Playwright journeys.

Prettier checks code and configuration but excludes manually maintained Markdown and generated Drizzle migration artifacts. `scripts/check.sh` runs formatting, linting, types, unit/component tests, migration consistency, and the production build. PostgreSQL integration and Playwright remain explicit commands because they require Docker or a locally installed browser binary.

## Runtime topology

### Local development

```text
Apple Silicon development Mac
  -> Next.js through pnpm on macOS
  -> PostgreSQL 16.14 linux/arm64 through Docker Compose
     -> chanq_page development database
     -> chanq_page_test isolated integration database
```

### Production

```text
Separate Apple Silicon production Mac running macOS
  -> Cloudflare Tunnel `linux/arm64` container
  -> Nginx `linux/arm64` container
  -> Next.js standalone `linux/arm64` container
  -> PostgreSQL `linux/arm64` container on a private Docker network
```

Keep development and production on different Macs with separate credentials, environment files, Docker volumes, and PostgreSQL data. Nginx owns origin request limits, proxy timeouts, controlled forwarded headers, and health routing. Cloudflare owns public DNS and edge HTTPS. Keep Nginx HTML caching disabled until Next.js caching and invalidation are measured independently.

## Version policy

- Resolve supported package versions during the scaffold task from current official compatibility guidance.
- Commit `pnpm-lock.yaml` and pin the supported Node.js range in project metadata.
- Pin Docker image versions intentionally instead of using floating `latest` tags.
- Verify every production image and native dependency for `linux/arm64` before release.
- Pin the same PostgreSQL major version and required extensions across development, test, restore verification, and production.
- Record consequential version exceptions in documentation; routine patch upgrades do not require an ADR.
