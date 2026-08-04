# Pre-Scaffold Technology Baseline

## Status

Approved for the next project-generation task. No application package or runtime configuration has been created yet.

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
| Boundary validation | Zod | Validate environment configuration, import inputs, and untrusted external data with strict TypeScript inference. |
| Long-form content | Markdown text | Avoid runtime execution of database-provided MDX or arbitrary components. |
| MVP write path | Internal server-only CLI or import use case | Add content without approving an admin UI, authentication, or a public write API. |
| Static images | Versioned files under `public/` with database references | Keep image upload and object storage outside the MVP. |

Do not expose Drizzle records or Zod schemas as domain models by default. Translate external data at the infrastructure or input boundary and pass project-owned types inward.

## Testing

| Layer | Tooling | Scope |
|---|---|---|
| Unit and synchronous component | Vitest, React Testing Library, and DOM matchers | Domain rules, application orchestration, validation, synchronous UI behavior, and regressions |
| PostgreSQL integration | Vitest against a dedicated compatible PostgreSQL database | Migrations, constraints, repository adapters, transactions, seeds, and import behavior |
| End-to-end | Playwright | Critical public navigation, project and article reading, direct URLs, 404 behavior, and accessibility-critical interactions |

Do not depend on component unit tests for asynchronous Server Components. Verify those paths through application tests and production-like Playwright journeys.

## Runtime topology

### Local development

```text
Next.js through pnpm on the host
  -> PostgreSQL through Docker Compose
```

### Production

```text
Cloudflare Tunnel
  -> Nginx
  -> Next.js standalone container
  -> PostgreSQL on a private Docker network
```

Use one self-hosted Linux machine and Docker Compose for the MVP. Nginx owns origin request limits, proxy timeouts, controlled forwarded headers, and health routing. Cloudflare owns public DNS and edge HTTPS. Keep Nginx HTML caching disabled until Next.js caching and invalidation are measured independently.

## Version policy

- Resolve supported package versions during the scaffold task from current official compatibility guidance.
- Commit `pnpm-lock.yaml` and pin the supported Node.js range in project metadata.
- Pin Docker image versions intentionally instead of using floating `latest` tags.
- Record consequential version exceptions in documentation; routine patch upgrades do not require an ADR.
