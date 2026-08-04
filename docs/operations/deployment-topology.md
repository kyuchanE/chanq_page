# Deployment Topology

## Current state

No deployable application or infrastructure configuration exists yet. This document defines staged adoption rules; it is not evidence that a service is deployed.

## Recommended MVP baseline

```text
Visitor
  -> Cloudflare DNS and edge HTTPS
  -> Hosting-provider ingress or a private Cloudflare Tunnel
  -> Next.js standalone container
```

Use a single application instance until availability or traffic measurements justify more. Build a production image with a non-root runtime user, an explicit health check, a read-only filesystem where practical, and only the required environment variables.

## Self-hosted variants

### Simplest private-origin path

```text
cloudflared container
  -> private Docker network
  -> Next.js container
```

Prefer this when there is one HTTP service and Cloudflare owns public TLS and routing.

### Nginx path

```text
cloudflared container
  -> Nginx container
  -> Next.js container
```

Add Nginx only when it owns a documented responsibility such as multiple upstream routes, origin-level request limits, buffering, controlled headers, or a verified static-file policy. Avoid duplicating Cloudflare and Next.js caching without a measured requirement.

## PostgreSQL stage

PostgreSQL is post-MVP. When adopted:

- Keep it on a private network with no public port by default.
- Use migrations as reviewed application artifacts.
- Define backup, restore, retention, and restore-test procedures before production writes.
- Use least-privilege application credentials and separate migration privileges where practical.
- Add readiness checks that distinguish database startup from migration completion.
- Preserve public slugs, metadata, and publication dates during MDX migration.

## Cloudflare boundaries

- Public portfolio routes must remain accessible to unauthenticated crawlers.
- Use Cloudflare Access only for admin, private preview, monitoring, or database tools.
- Store tunnel tokens and API credentials outside Git.
- Distinguish Cloudflare DNS/HTTPS configuration from Tunnel; either may be used without the other.
- Document cache rules, bypass conditions, purge ownership, and the effect of Next.js revalidation before enabling HTML caching at the edge.

## Verification checklist

For every deployment topology, verify:

1. A clean production image builds reproducibly.
2. Containers become healthy and restart safely.
3. Direct URLs and browser refreshes return the intended page and status.
4. Unknown routes return a correct 404.
5. Public pages are indexable and private tools are not public.
6. Forwarded host, scheme, and client IP headers are trusted only from known proxies.
7. Logs contain useful correlation context without secrets or personal data.
8. Failure of Next.js, Nginx, Tunnel, or PostgreSQL produces a known signal and recovery action.
9. Rollback preserves compatible content and data.

## Caching rollout

Enable and validate caching in this order:

1. Next.js rendering and data cache behavior
2. Browser asset caching
3. Cloudflare static-asset behavior
4. Cloudflare HTML caching only with an explicit stale-data budget and purge path
5. Nginx caching only if it solves a separately measured origin problem

Test each layer for miss, hit, stale, refresh, purge, and failure behavior before introducing the next.
