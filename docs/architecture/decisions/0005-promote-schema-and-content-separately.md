# ADR-0005: Promote PostgreSQL Schema and Content Separately

## Status

Accepted

## Context

The development and production PostgreSQL instances run on separate Apple Silicon Macs as defined by [ADR-0004](0004-use-separate-apple-silicon-macos-hosts.md). Development must validate schema changes, migrations, repository adapters, and content before release without turning the development database or its Docker volume into the production source of truth.

Copying `/var/lib/postgresql/data` or a Docker volume across hosts couples recovery to PostgreSQL internals, image versions, filesystem state, architecture, and shutdown consistency. Restoring a complete development database during every deployment would also risk promoting test data, development roles, local privileges, or stale migration state and could overwrite content created in production.

## Decision

Promote schema and content through separate, controlled release artifacts.

- Treat committed, reviewed Drizzle SQL migrations as the only schema-promotion artifact.
- Validate the complete migration history against a fresh compatible PostgreSQL test database and validate upgrades against representative existing data before release.
- Treat the validated internal content import path as the default production content-promotion mechanism.
- Keep development seeds, test seeds, and production content inputs separate. Never promote automated test fixtures or an unreviewed development database to production.
- Pin the same PostgreSQL major version and required extensions in development, test, restore verification, and production environments.
- Never copy or transfer `/var/lib/postgresql/data`, Docker volumes, or physical database files between the development and production Macs.
- Permit an encrypted PostgreSQL custom-format logical backup created with `pg_dump` only for a one-time initial production bootstrap when the source database has been sanitized and verified, or for disaster recovery from an approved production backup. Restore it with `pg_restore` into an isolated database first.
- After public launch, create recovery backups from production. Never overwrite the active production database with a development backup.
- Restore every logical backup into a new isolated database first, verify its checksum, migration ledger, constraints, row counts, representative repository reads, and application behavior, and only then authorize a controlled cutover.
- Transfer backup artifacts through an encrypted channel and keep them out of Git, container images, and application build artifacts.

## Alternatives considered

- **Restore a full development dump on every deployment:** rejected because it conflates schema, content, credentials, and environment-specific state and can destroy production-only changes.
- **Copy the PostgreSQL data directory or Docker volume:** rejected because it is unsafe across running instances, versions, container images, filesystems, and hosts.
- **Use logical dumps as the normal schema migration mechanism:** rejected because reviewed migrations provide deterministic, incremental schema history and safer compatibility analysis.
- **Maintain development files as a second runtime content source:** rejected by ADR-0003 because two authoritative stores create synchronization and recovery ambiguity.

## Consequences

- A release needs explicit migration, import, verification, and rollback stages.
- Initial bootstrap and disaster recovery require logical-backup tooling, encryption, checksums, isolated restore capacity, and recorded evidence.
- Development remains free to use synthetic data without risking accidental production promotion.
- Production becomes the source of operational backups immediately after launch.
- Content imports must be idempotent or provide deterministic conflict handling and must require explicit target-environment confirmation.

## Revisit when

Revisit this decision when a browser-based production authoring system replaces the import workflow, data volume requires physical backup or continuous archiving, recovery objectives become shorter than logical backups can support, or PostgreSQL high availability is introduced.
