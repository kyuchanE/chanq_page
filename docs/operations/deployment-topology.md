# Deployment Topology

## Current state

The development Mac has a project-local PostgreSQL Compose service, but no production application or infrastructure configuration exists yet. The local service is not a production deployment. This document defines the remaining staged adoption rules.

## Recommended MVP baseline

```text
Visitor
  -> Cloudflare DNS and edge HTTPS
  -> Cloudflare Tunnel
  -> Nginx container
  -> Next.js standalone container
  -> PostgreSQL container on a private network

All origin containers
  -> dedicated Apple Silicon production Mac
  -> macOS Docker runtime
  -> pinned Linux/arm64 images
```

Use a dedicated Apple Silicon Mac running macOS and one application instance until availability or traffic measurements justify more. Build a `linux/arm64` production image with a non-root runtime user, an explicit health check, a read-only filesystem where practical, and only the required environment variables. The image build must not connect to a production database.

## Host separation

The Apple Silicon development Mac and Apple Silicon production Mac have different responsibilities:

| Development Mac | Production Mac |
|---|---|
| Source changes and local builds | Public runtime and production health |
| Development and isolated test PostgreSQL | Private production PostgreSQL |
| Migration, import, repository, and restore rehearsal | Explicit migrations, confirmed imports, backups, and recovery |
| Synthetic development and test data | Production content and secrets |

Never synchronize environment files, credentials, bind-mounted PostgreSQL data directories, or Docker volumes between the Macs. Before launch, disable unintended host sleep and verify Docker runtime startup after reboot, sufficient host and virtual-machine disk capacity, clock synchronization, remote recovery access, and off-host backup delivery.

## Origin path

```text
cloudflared container
  -> Nginx container
  -> Next.js container
```

For the MVP, Nginx owns origin request limits, proxy timeouts, controlled forwarded headers, and health routing. It does not own HTML caching. Cloudflare owns public DNS and edge HTTPS; Tunnel prevents direct public origin ingress. Avoid duplicating Cloudflare and Next.js caching without a measured requirement.

## PostgreSQL

PostgreSQL is an MVP component and the runtime source of truth for public content.

- Keep it on a private network with no public port by default.
- Pin the same PostgreSQL major version and required extensions in development, test, restore verification, and production.
- Use committed migrations as reviewed schema-release artifacts.
- Use the validated internal import path as the default content-release mechanism.
- Never copy `/var/lib/postgresql/data`, a Docker volume, or physical PostgreSQL files between hosts.
- Define backup, restore, retention, and restore-test procedures before production writes.
- Use least-privilege application credentials and separate migration privileges where practical.
- Add readiness checks that distinguish database startup from migration completion.
- Run migrations as an explicit release step instead of automatically on each application start.
- Preserve public slugs, metadata, publication state, and publication dates during schema changes.
- Follow `postgresql-lifecycle.md` for seed, import, backup, restore, and verification policy.

## Database promotion and recovery

Use this default release sequence:

1. Validate the complete migration history, upgrade path, repository adapters, and content import on the development Mac against compatible isolated databases.
2. Build and verify the production image without connecting to production data.
3. Create a production backup before a risky migration.
4. Apply reviewed migrations explicitly on the production Mac.
5. Run the validated content import with an explicit production target and confirmation.
6. Verify the migration ledger, constraints, representative reads, application health, and public routes.

An encrypted `pg_dump` custom-format logical backup may be transferred from a sanitized development database only for a one-time initial bootstrap. After launch, disaster-recovery backups originate from production. Restore any backup with `pg_restore` into a new isolated database, verify its checksum and behavior, then perform a separately authorized cutover; never restore directly over the active production database.

## Cloudflare boundaries

- Public portfolio routes must remain accessible to unauthenticated crawlers.
- Use Cloudflare Access only for admin, private preview, monitoring, or database tools.
- Store tunnel tokens and API credentials outside Git.
- Distinguish Cloudflare DNS/HTTPS configuration from Tunnel; either may be used without the other.
- Document cache rules, bypass conditions, purge ownership, and the effect of Next.js revalidation before enabling HTML caching at the edge.

## Verification checklist

For every deployment topology, verify:

1. Every production image and native dependency supports `linux/arm64` without emulation.
2. A clean production image builds reproducibly.
3. Containers become healthy and restart safely after both container and macOS host restarts.
4. Host sleep is disabled and disk-capacity alerts include Docker virtual-machine storage.
5. Direct URLs and browser refreshes return the intended page and status.
6. Unknown routes return a correct 404.
7. Public pages are indexable and private tools are not public.
8. Forwarded host, scheme, and client IP headers are trusted only from known proxies.
9. Logs contain useful correlation context without secrets or personal data.
10. Failure of Next.js, Nginx, Tunnel, PostgreSQL, the Docker runtime, or the macOS host produces a known signal and recovery action.
11. Rollback preserves compatible content and data, and a current production backup has passed isolated restore verification.

## Caching rollout

Enable and validate caching in this order:

1. Next.js rendering and data cache behavior
2. Browser asset caching
3. Cloudflare static-asset behavior
4. Cloudflare HTML caching only with an explicit stale-data budget and purge path
5. Nginx caching only if it solves a separately measured origin problem

Test each layer for miss, hit, stale, refresh, purge, and failure behavior before introducing the next.
