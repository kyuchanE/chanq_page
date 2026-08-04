# Source Instructions

Keep production TypeScript under this directory. Use `app/` for Next.js entry points, `features/` for feature-owned behavior, and `shared/` for stable feature-neutral code.

- Maintain inward dependency direction; framework and adapter types stay at outer boundaries.
- Prefer Server Components and pure server-side functions until interaction requires a client boundary.
- Validate external data before it reaches domain or application code.
- Co-locate small unit tests with pure modules when that improves discoverability; place cross-boundary tests under `tests/`.
- Do not bypass feature APIs with deep cross-feature imports.
- Add architectural enforcement once importable source code exists.
