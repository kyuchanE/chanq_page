---
name: operate-local-stack
description: Configure, inspect, start, validate, troubleshoot, and safely change the project's Docker Compose, PostgreSQL, Nginx, and Cloudflare Tunnel stack. Use for local or self-hosted infrastructure work, deployment topology changes, container health, private networking, proxy headers, database migrations, tunnel routing, caching, diagnostics, and recovery procedures.
---

# Operate Local Stack

Operate infrastructure incrementally, preserve secrets and data, and verify each boundary before changing the next.

## Procedure

1. Read root and infrastructure `AGENTS.md` files, `docs/operations/deployment-topology.md`, relevant ADRs, current configuration, environment examples, and Git diff.
2. Confirm the target environment and the responsibility of every requested component. Do not adopt PostgreSQL, Nginx, or Tunnel until its documented gate is met.
3. Inspect versions, Compose profiles, rendered configuration, networks, ports, volumes, secrets, health checks, restart behavior, and current service state using read-only commands first.
4. Plan data safety and rollback before migrations, volume changes, route changes, cache purges, or service replacement. Require explicit authority for production or destructive actions.
5. Keep secrets outside Git. Use safe placeholders in examples and least-privilege credentials in the runtime secret store.
6. Validate components from the inside out: application process, PostgreSQL when adopted, Docker health, optional Nginx proxy, optional Tunnel, and finally public Cloudflare behavior.
7. Add one caching layer at a time. Verify miss, hit, stale, refresh, purge, and failure behavior at Next.js before adding edge or proxy HTML caching.
8. Update infrastructure configuration, operations docs, and an ADR together when topology or ownership changes.
9. Run configuration-native validation, `docker compose config` when Compose exists, targeted health checks, `./scripts/check.sh`, and a clean application production build where applicable.

## Safety rules

- Keep PostgreSQL private by default and define backup plus tested restore before production writes.
- Keep public portfolio routes outside Cloudflare Access.
- Trust forwarded headers only through known proxies.
- Avoid Nginx when Tunnel can safely route a single service directly to Next.js.
- Do not run migrations, deploy, change DNS, rotate credentials, purge production caches, or remove volumes without explicit authorization.

## Handoff

Report topology and configuration changes, exact commands and health evidence, secret handling, data and rollback status, checks not run, and remaining operational risks.
