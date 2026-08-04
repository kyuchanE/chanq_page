# Developer Portfolio

This repository contains the foundation for a personal developer portfolio built with Next.js and TypeScript. The project emphasizes evidence-based project case studies, technical writing, accessibility, performance, SEO, and understandable production operations.

The repository is currently in the **application scaffold phase**. A minimal Next.js App Router application now runs alongside the existing project harness, documentation, and scoped instructions. Portfolio features, PostgreSQL persistence, tests, and production infrastructure will be added as reviewable vertical slices.

## Start here

1. Read [`AGENTS.md`](AGENTS.md) before making a change.
2. Use [`docs/index.md`](docs/index.md) as the documentation map.
3. Read [`portfolio-project-plan.md`](portfolio-project-plan.md) for the original product plan.
4. Run `./scripts/check.sh` before handing off a change.

## Local development

Prerequisites:

- Node.js 20.9 or later
- pnpm 11.9.0 through Corepack or an equivalent pnpm installation

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

The empty scaffold is available at `http://localhost:3000`. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` as the current application quality gates.

## Technical direction

- Next.js App Router and strict TypeScript
- PostgreSQL as the MVP source of truth for projects, developer skills, and Markdown blog content
- Drizzle ORM and reviewed SQL migrations
- Zod validation at environment, import, and external-data boundaries
- Tailwind CSS for responsive presentation
- Vitest and React Testing Library for unit and component tests, plus Playwright for critical end-to-end journeys
- Feature-first, proportional Clean Architecture
- Docker-based production packaging
- A single-host Docker Compose topology with private PostgreSQL, Nginx ingress, and Cloudflare Tunnel

The application scaffold now provides Next.js App Router, React Compiler, strict TypeScript, Tailwind CSS, ESLint, Turbopack, the `@/*` import alias, and a committed pnpm lockfile. Database, testing, and production infrastructure dependencies remain planned and will be introduced only with the vertical slices that need them.

See [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) for the current architecture and [`docs/development/codex-workflow.md`](docs/development/codex-workflow.md) for the detailed development workflow.
