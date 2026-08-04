# Developer Portfolio

This repository will contain a personal developer portfolio built with Next.js and TypeScript. The project emphasizes evidence-based project case studies, technical writing, accessibility, performance, SEO, and understandable production operations.

The repository is currently in the **project-harness phase**. Application runtime code has not been scaffolded yet. The current files define what to build, how Codex should work in each area, how architectural decisions are recorded, and how the repository structure is validated.

## Start here

1. Read [`AGENTS.md`](AGENTS.md) before making a change.
2. Use [`docs/index.md`](docs/index.md) as the documentation map.
3. Read [`portfolio-project-plan.md`](portfolio-project-plan.md) for the original product plan.
4. Run `./scripts/check.sh` before handing off a change.

## Planned technical direction

- Next.js App Router and strict TypeScript
- Local MDX content for the MVP
- Feature-first, proportional Clean Architecture
- Docker-based production packaging
- Cloudflare DNS and HTTPS
- PostgreSQL, Nginx, and Cloudflare Tunnel only when their documented adoption criteria are met

See [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) for the current architecture and [`docs/development/codex-workflow.md`](docs/development/codex-workflow.md) for the detailed development workflow.
