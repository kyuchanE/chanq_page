# Cloudflare Instructions

- Keep account IDs, zone IDs, API tokens, tunnel credentials, and origin certificates out of Git.
- Treat DNS/HTTPS, Tunnel, Access, WAF, and caching as separate capabilities with separate decisions.
- Never protect public portfolio routes with Access.
- Limit Access to private administration, previews, monitoring, or internal tools.
- Use least-privilege API tokens and document credential rotation outside the repository.
- Test cache rules against Next.js revalidation and document purge ownership.
- Verify tunnel health and a safe fallback before changing production routing.
