---
name: operate-local-stack
description: Configure, inspect, start, validate, troubleshoot, and safely change the project's Docker Compose, PostgreSQL, Nginx, and Cloudflare Tunnel stack. Use for local or self-hosted infrastructure work, deployment topology changes, container health, private networking, proxy headers, database migrations, tunnel routing, caching, diagnostics, and recovery procedures.
---

# Operate Local Stack

Operate infrastructure incrementally, preserve secrets and data, and verify each boundary before changing the next.

## Procedure

1. Read root and infrastructure `AGENTS.md` files, `docs/operations/deployment-topology.md`, relevant ADRs, current configuration, environment examples, and Git diff.
2. Confirm whether work targets the Apple Silicon development Mac, the separate Apple Silicon production Mac, or an isolated test or restore environment. PostgreSQL, Nginx, and Tunnel are approved MVP components; add them incrementally according to the documented topology and current implementation phase.
3. Inspect versions, `linux/arm64` image support, Compose profiles, rendered configuration, networks, ports, volumes, secrets, health checks, macOS Docker storage, host sleep, restart behavior, and current service state using read-only commands first.
4. Plan data safety and rollback before migrations, volume changes, route changes, cache purges, or service replacement. Require explicit authority for production or destructive actions.
5. Keep secrets outside Git. Use safe placeholders in examples and least-privilege credentials in the runtime secret store.
6. Validate components from the inside out: PostgreSQL readiness and migration state, application process, Docker health, Nginx proxy, Tunnel, and finally public Cloudflare behavior.
7. Add one caching layer at a time. Verify miss, hit, stale, refresh, purge, and failure behavior at Next.js before adding edge or proxy HTML caching.
8. Update infrastructure configuration, operations docs, and an ADR together when topology or ownership changes.
9. Run configuration-native validation, `docker compose config` when Compose exists, targeted health checks, `./scripts/check.sh`, and a clean application production build where applicable.

## Safety rules

- Keep development and production hosts, credentials, environment files, databases, and Docker volumes separate.
- Promote schema with committed migrations and content through the validated import path by default.
- Never copy `/var/lib/postgresql/data`, Docker volumes, or physical PostgreSQL files between hosts.
- Use `pg_dump` custom-format logical backups only for a verified initial bootstrap or disaster recovery, and run `pg_restore` against an isolated database before authorizing cutover.
- After launch, create recovery backups from production and never overwrite production with a development backup.
- Keep PostgreSQL private by default and define backup plus tested restore before production writes.
- Keep public portfolio routes outside Cloudflare Access.
- Trust forwarded headers only through known proxies.
- Keep Nginx limited to origin request limits, proxy timeouts, controlled forwarded headers, and health routing; do not add origin HTML caching without a measured requirement and verified invalidation path.
- Do not run migrations, deploy, change DNS, rotate credentials, purge production caches, or remove volumes without explicit authorization.

## Handoff

Report topology and configuration changes, exact commands and health evidence, secret handling, data and rollback status, checks not run, and remaining operational risks.
