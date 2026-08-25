# Developer Portfolio

This repository contains the foundation for a personal developer portfolio built with Next.js and TypeScript. The project emphasizes evidence-based project case studies, technical writing, accessibility, performance, SEO, and understandable production operations.

The repository is currently in the **PostgreSQL-backed public content phase**. Six static placeholder sections run alongside a dynamic Projects list and case-study detail route backed by the project-local PostgreSQL 16 container. The Projects slice validates database rows, excludes drafts, orders published content deterministically, renders controlled CommonMark, and exposes stable metadata and 404 behavior. Remaining repositories, content imports, feature behavior, and production infrastructure will be added as reviewable vertical slices.

## Start here

1. Read [`AGENTS.md`](AGENTS.md) before making a change.
2. Use [`docs/index.md`](docs/index.md) as the documentation map.
3. Read [`portfolio-project-plan.md`](portfolio-project-plan.md) for the original product plan.
4. Run `./scripts/check.sh` before handing off a change.

## Local development

Prerequisites:

- Node.js 20.9 or later
- Corepack-managed pnpm 11.9.0
- Docker Desktop with Apple Silicon and Docker Compose support

Install dependencies, start PostgreSQL, synchronize the safe development fixtures, and start the development server:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm db:local:up
pnpm db:seed:dev
pnpm dev
```

The Home route is available at `http://localhost:3000`. Projects reads published development content at runtime; About, Skills, Retrospectives, Blog, and Contact remain placeholders.

Run the deterministic repository and application gates before handing off a change:

```bash
pnpm check
```

This runs repository structure and documentation checks, formatting, ESLint, TypeScript, Vitest, Drizzle migration consistency, and a production build. Markdown and generated migration artifacts are intentionally outside Prettier's scope. PostgreSQL integration and production-like browser checks remain explicit because they require local services or a browser binary:

```bash
pnpm db:test:integration
pnpm test:e2e
```

Use `pnpm format` to apply code and configuration formatting, `pnpm test:watch` during focused unit/component work, and `pnpm format:check` for a non-mutating formatting check.

### Local PostgreSQL

The project database runs in Docker and binds only to `127.0.0.1:5433`, leaving an existing native PostgreSQL listener on 5432 untouched. On first setup, create the ignored local environment file, replace every placeholder, then start and migrate both isolated databases:

```bash
cp .env.example .env.local
pnpm db:local:up
pnpm db:roles:provision
pnpm db:migrate
pnpm db:migrate:test
pnpm db:seed:dev
pnpm db:seed:test:reset
pnpm db:test:integration
pnpm db:seed:status
pnpm db:status
```

`chanq_page` is the development database and `chanq_page_test` is reserved for resettable integration and browser tests. The local `root` PostgreSQL role is used only for bootstrap, migrations, reset, and role administration. Routine development uses `chanq_page_app`; integration checks and Playwright use `chanq_page_test_app`. Each application role can access only its own database and cannot create schema objects or read the migration ledger. Do not reuse any local credential in production. `pnpm db:local:down` stops the service without deleting the named volume.

`pnpm db:seed:dev` idempotently synchronizes only the reserved `dev-seed-` fixture namespace and preserves other development rows. `pnpm db:seed:test:reset` deletes and rebuilds content only in the isolated test database with separate synthetic fixtures. Both flows use fixed UUIDs and timestamps through their least-privilege application roles. Use `pnpm db:seed:status` for a read-only count summary.

Use `pnpm db:generate -- --name <migration_name>` after an intentional schema change, review the generated SQL, and run `pnpm db:check` before applying it. Applied migrations are immutable.

## Environment model

Development and production use separate Apple Silicon Macs. The development Mac owns source changes, local validation, development and test databases, migrations, and reviewed content preparation. The production Mac will run pinned `linux/arm64` Docker containers and own production secrets, data, backups, and service health when the infrastructure is scaffolded.

Promote schema with committed migrations and promote content through the validated import path. Never copy PostgreSQL data directories or Docker volumes between hosts. A custom-format logical backup created with `pg_dump` and restored with `pg_restore` is reserved for a verified one-time production bootstrap or disaster recovery.

## Technical direction

- Next.js App Router and strict TypeScript
- PostgreSQL as the MVP source of truth for projects, developer skills, and Markdown blog content
- Drizzle ORM and reviewed SQL migrations
- Zod validation at environment, import, and external-data boundaries
- Tailwind CSS for responsive presentation
- Vitest and React Testing Library for unit and component tests, plus Playwright for critical end-to-end journeys
- Feature-first, proportional Clean Architecture
- Docker-based production packaging
- A dedicated Apple Silicon macOS production host running private PostgreSQL, Nginx, Next.js, and Cloudflare Tunnel as `linux/arm64` Docker containers

The application scaffold now provides Next.js App Router, React Compiler, strict TypeScript, Tailwind CSS, ESLint, Turbopack, the `@/*` import alias, and a committed pnpm lockfile. Prettier, Vitest, React Testing Library, DOM matchers, and Playwright provide deterministic formatting and test entry points. The local database foundation adds PostgreSQL 16.14, Drizzle ORM and Kit, `node-postgres`, Zod environment and row validation, development and test databases, migration status reporting, deterministic isolated data, and transactional integration checks. The project repository and public Projects experience are implemented; skill and post repositories, content import, and production infrastructure remain planned.

See [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) for the current architecture and [`docs/development/codex-workflow.md`](docs/development/codex-workflow.md) for the detailed development workflow.
