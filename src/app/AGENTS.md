# Next.js App Router Instructions

This directory owns route segments, layouts, metadata, loading and error UI, route handlers, server actions, and dependency composition.

- Keep route files thin: parse framework input, call a feature, and render or translate the result.
- Use Server Components by default. Add `use client` at the smallest interactive leaf.
- Select static, revalidated, or dynamic rendering from documented freshness and personalization needs.
- Keep secrets and privileged operations in server-only modules.
- Return correct HTTP status codes and provide accessible loading, empty, error, and not-found states.
- Generate metadata and structured data from the same validated visible content.
- Do not define reusable domain policy in a page, layout, route handler, or server action.
