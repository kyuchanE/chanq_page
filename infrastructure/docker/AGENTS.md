# Docker Instructions

- Use multi-stage builds and a minimal non-root production image.
- Optimize dependency caching without copying secrets or development artifacts.
- Prefer Next.js standalone output when the application configuration supports it.
- Add explicit health checks and graceful stop behavior.
- Keep Compose service names, networks, volumes, and profiles understandable.
- Do not expose internal service ports to the host or public network without a documented need.
- Make local startup repeatable from documented environment examples.
