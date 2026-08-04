# Infrastructure Instructions

This directory owns versioned deployment and service configuration. Application policy belongs in `src/`; operating explanations and runbooks belong in `docs/operations/`.

- Keep local, test, and production differences explicit.
- Never commit credentials or production identifiers; provide safe examples.
- Pin intentional image versions and review upgrades.
- Use private networks, least privilege, health checks, resource limits where known, and graceful shutdown.
- Validate rendered configuration before starting or replacing services.
- Document operational behavior, recovery, and rollback with every consequential change.
- Do not add an infrastructure component until its responsibility is documented. PostgreSQL, Docker, Nginx, and Cloudflare Tunnel are approved MVP components; additional services still require an adoption decision.

## Docker

- Use multi-stage builds and a minimal non-root production image.
- Prefer Next.js standalone output when supported, add health checks and graceful shutdown, and keep Compose networks, volumes, profiles, and exposed ports explicit.
- Do not expose internal services without a documented need.

## Cloudflare

- Keep account, zone, token, tunnel, and certificate values out of Git.
- Treat DNS and HTTPS, Tunnel, Access, WAF, and caching as separate capabilities.
- Keep public portfolio routes outside Access and use least-privilege API tokens.
- Test cache rules against Next.js revalidation and verify tunnel recovery before production routing changes.

## Nginx

- Include Nginx in the approved MVP topology to own origin request limits, proxy timeouts, controlled forwarded headers, and health routing that should remain outside feature code.
- Validate with `nginx -t`; define forwarded headers, request limits, timeouts, buffering, compression, TLS ownership, and caching deliberately.
- Preserve Next.js streaming, static assets, route status codes, and direct navigation.

## PostgreSQL

- Use PostgreSQL as the MVP source of truth for projects, developer skills, and blog posts; keep it private with least-privilege roles.
- Treat applied migrations as immutable and add deterministic forward migrations for changes.
- Use constraints and transactions for invariants and atomic behavior.
- Define backup, retention, restore, and restore-test procedures before production writes.
- Test repository adapters and migrations against a compatible PostgreSQL instance and preserve public content URLs during every schema change.
- Run migrations as an explicit release action rather than automatically on every application startup.
- Keep development, test, and production databases and credentials separate.
