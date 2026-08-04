# Nginx Instructions

Nginx is optional. Add configuration only after a responsibility is documented that Cloudflare and Next.js do not already satisfy adequately.

- Validate configuration with `nginx -t` in the target image.
- Set forwarded headers deliberately and trust them only through the known proxy path.
- Define request size, timeout, buffering, compression, and caching behavior explicitly.
- Preserve Next.js static assets, streaming, route status codes, and direct navigation.
- Avoid HTML caching until invalidation and stale-data behavior are tested end to end.
- Keep TLS termination ownership unambiguous; Cloudflare may terminate public TLS.
