# ADR-0008: Use Versioned Content Imports

## Status

Accepted

## Context

The PostgreSQL content model and public repositories are implemented. Contributors need a controlled local create/update/publication path that preserves stable identities, validates relations, keeps seed data separate, and cannot partially apply a content bundle. The MVP excludes an administrator UI, public write API, and content revision history.

## Decision

- Accept explicit version-1 JSON bundles containing projects, skills, posts, tags, and owner-scoped relation lists. Validate file metadata with Zod and pass project-owned values to application behavior.
- Keep PostgreSQL authoritative. Import inputs are promotion/authoring artifacts and are not automatically synchronized or loaded by public routes.
- Match records by skill key or tag/project/post slug. Preserve database-generated UUIDs and creation timestamps; unchanged normalized records preserve modification timestamps too. Imports do not rename or delete records.
- Treat each supplied project's skill relations and each supplied post's tag/project relations as a complete replacement for that owner. Preserve omitted records and other owners' relations. Resolve references against the input plus existing database records.
- Require explicit publication state and UTC timestamps. Publishing a new record or an existing draft additionally requires publication permission at the CLI. This permission cannot promote an input draft. Published edits and explicit unpublication remain supported.
- Reject existing post-kind changes to preserve the canonical URL ownership established by [ADR-0007](0007-classify-posts-by-kind.md).
- Implement a transaction-scoped project-owned import repository port. Use the Drizzle PostgreSQL adapter with serializable transactions; dry-run is database-enforced read-only and apply is atomic. Report concurrent conflicts for review instead of retrying automatically.
- Limit execution to the known local development/test application roles, with URL and connected-identity validation. Production execution/confirmation is not implemented by this decision.
- Keep fixture markers out of authored content inputs. Summaries and errors omit credentials and full content bodies.

## Alternatives considered

- **Ad hoc SQL:** does not provide one validated publication policy, stable update contract, or reusable application test boundary.
- **Markdown files with implicit publication/frontmatter defaults:** makes the publication boundary less explicit and risks reviving a second runtime content source. Markdown bodies remain supported inside the JSON document.
- **Whole-database replacement:** risks deleting omitted content and promoting fixture or environment-specific state.
- **Merge-only relation updates:** cannot express removing a relation reliably. Complete owner-scoped lists are deterministic and remain limited to supplied owners.
- **Writing and rolling back during dry-run:** can execute triggers or other effects and does not satisfy the zero-write requirement. A read-only transaction gives an enforceable boundary.

## Consequences

Contributors must review complete supplied records and relation lists. Import is not a patch language, rename tool, revision store, or production deployment command. A dry-run reflects its own snapshot; apply validates again because state may change. Transactions protect atomicity, while idempotent repeated inputs support safe retry after checking an uncertain connection outcome.

The CLI uses the same TypeScript feature code as tests through a pinned `tsx` development dependency. It is outside the Next.js route tree; database-specific types and errors stay within infrastructure. No schema change is required.

## Revisit when

Revisit the format version and confirmation policy when production imports are authorized, URL-preserving renames/redirects are required, collaborative editing creates conflict-resolution needs, or an administrator UI/content revision model is approved.
