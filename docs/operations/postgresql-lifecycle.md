# PostgreSQL Lifecycle

## Status

Implemented local foundation and approved production policy for separate Apple Silicon development and production Macs. Development and test use the `postgres` Compose service and the commands below. Production credentials, services, backup automation, and restore verification remain intentionally unimplemented.

## Local implementation status

| Concern | Current state |
|---|---|
| PostgreSQL image | Pinned `postgres:16.14-bookworm` on `linux/arm64` |
| Host access | `127.0.0.1:5433` only; native PostgreSQL on 5432 remains independent |
| Development database | `chanq_page` |
| Integration database | `chanq_page_test`; resettable synthetic fixtures and automated PostgreSQL checks run here only |
| Bootstrap role | Local-only PostgreSQL superuser `root`; never reuse in production |
| Development application role | `chanq_page_app`; DML on `chanq_page` only |
| Test application role | `chanq_page_test_app`; DML on `chanq_page_test` only |
| Schema | Seven content tables from two committed Drizzle migrations |
| Deterministic local data | Fixed development seed identities plus independently resettable synthetic test fixtures |
| Progress evidence | Container health, migration and table counts, isolated full-history and upgrade checks, seed status, permission checks, deterministic reset checks, and transactional schema checks |
| Content import | Version-1 JSON, explicit local targets/publication, read-only dry-run, and atomic application-role writes with deterministic repeat behavior |
| Not implemented | Production import execution, production Compose, backup automation, restore drill |

Actual credentials and connection URLs live only in ignored `.env.local`. The tracked `.env.example` contains safe placeholders. The PostgreSQL role named `root` is not the macOS root account and does not grant host privileges.

## Environment separation

Maintain separate development, test, and production databases. Never run automated tests against development or production data.

| Environment | Location | Data policy |
|---|---|---|
| Development | PostgreSQL container on the development Mac | Developer-authored drafts and deterministic development seed data |
| Test | Isolated compatible PostgreSQL database on the development Mac or CI | Synthetic fixtures only; resettable and never reused as development or production data |
| Production | Private PostgreSQL container on the production Mac | Sole source of public runtime content and origin of operational backups after launch |
| Restore verification | New isolated compatible database | Temporary verified restore target; never the active production database |

Pin the same PostgreSQL major version and required extensions in every environment. Keep database names, roles, credentials, environment files, and Docker volumes distinct.

Database configuration:

- `DATABASE_URL` for routine development application access
- `TEST_DATABASE_URL` for integration access to the isolated test database
- `MIGRATION_DATABASE_URL` for elevated development migrations
- `TEST_MIGRATION_DATABASE_URL` for elevated test migrations
- Container bootstrap values supplied through ignored environment files or a secret store

Provide safe placeholders in `.env.example`. Never expose database configuration through a `NEXT_PUBLIC_` variable.

## Local development

Run Next.js on the Apple Silicon development Mac for fast feedback and run compatible `linux/arm64` PostgreSQL containers through Docker Compose. Bind a development database port to localhost only when host access is required. Use separate development and test databases and require a health check before migrations, seeds, imports, or integration tests.

Before a release, verify the complete migration history against a fresh test database, the upgrade path against representative existing data, repository adapter behavior, content validation, and backup restore against the pinned PostgreSQL major version.

### First-time setup

```bash
cp .env.example .env.local
pnpm db:local:up
pnpm db:roles:provision
pnpm db:migrate
pnpm db:migrate:test
pnpm db:seed:dev
pnpm db:seed:test:reset
pnpm db:test:integration
pnpm db:seed:status
pnpm db:status
```

Replace all placeholders before startup and percent-encode reserved password characters in connection URLs. Docker initialization scripts create the test database only when the named volume is first initialized. Do not delete or recreate that volume casually; it is local state even though it is not a deployment artifact.

Fresh volumes provision the development and test application roles during PostgreSQL initialization. Run `pnpm db:roles:provision` for an existing volume and whenever role passwords or grants intentionally change; the command is idempotent and does not recreate the volume. `pnpm db:local:down` stops the service while preserving the named volume. The Compose health check gates `db:local:up`, and the host mapping stays on loopback port 5433 to avoid changing the separately installed Homebrew PostgreSQL 16 service on port 5432.

The local `root` role owns bootstrap, migrations, database-level reset, and role administration. Routine development access and seed DML use `chanq_page_app`; integration access and fixture-reset DML use `chanq_page_test_app`. The application roles cannot connect across environments, create database objects, or read the Drizzle migration ledger. Actual passwords remain in ignored `.env.local`; `.env.example` contains role names and safe placeholders only.

### Migration and progress commands

```bash
pnpm db:generate --name <migration_name>
pnpm db:check
pnpm db:migrate
pnpm db:migrate:test
pnpm db:roles:provision
pnpm db:status
pnpm db:seed:dev
pnpm db:seed:test:reset
pnpm db:seed:status
pnpm db:test:permissions
pnpm db:test:migrations
pnpm db:test:seeds
pnpm db:test:schema
pnpm db:test:integration
```

`db:status` is read-only and reports container health, server version, role properties, database ACLs, applied migration count, and table counts without printing credentials. `db:seed:status` reports total and fixture-owned base-table counts through each application role. `db:test:permissions` verifies application-role DML, DDL denial, migration-ledger denial, and cross-database isolation. `db:test:migrations` requires an explicit temporary-database flag internally, creates two fixed isolated databases, verifies the full SQL history and a representative upgrade with existing rows, and removes both databases on exit. `db:test:seeds` verifies wrong-target rejection, repeated development seed identity and count stability, isolated test drift recovery, and cross-environment marker isolation. `db:test:schema` authenticates as `chanq_page_test_app`, runs against `chanq_page_test` inside a transaction, and rolls its probe writes back. `db:test:integration` runs all PostgreSQL boundary checks. Keep generated SQL and Drizzle migration metadata together in version control.

### Deterministic local data

Run the development seed after migrations:

```bash
pnpm db:seed:dev
```

The development fixture uses fixed UUIDs and timestamps and owns only stable keys and slugs beginning with `dev-seed-`. Re-running the command updates the current fixture rows, rebuilds relations owned by fixture projects and posts, and prunes stale rows only inside that reserved namespace. Other development rows are preserved. Do not use the reserved prefix for manually authored data.

Reset the isolated test dataset with:

```bash
pnpm db:seed:test:reset
```

The reset requires the configured development and test database names and application roles to differ, requires the test database name to end in `_test`, and then verifies the exact `chanq_page_test` database and `chanq_page_test_app` role again inside SQL. It deletes all seven content tables through application-level DML and inserts separate fixed `test-fixture-` synthetic rows. It never reads or copies development seed rows.

Both operations run in a transaction with `ON_ERROR_STOP`. A failed statement rolls back the full operation. For recovery, inspect `pnpm db:seed:status`, resolve the reported constraint, role, or target mismatch, and rerun the same command. Do not delete the PostgreSQL volume to recover from a seed failure. `pnpm db:test:seeds` intentionally mutates the reserved development fixture namespace and the isolated test database while proving repeated stability and reset recovery; it does not modify non-fixture development rows.

## Migrations

Use committed Drizzle-generated SQL migration artifacts.

1. Change the typed schema deliberately.
2. Generate a named migration.
3. Review SQL for constraints, indexes, locks, data loss, and compatibility.
4. Validate the full migration history against a fresh test database.
5. Validate upgrade behavior against representative existing data when a table already contains production rows.
6. Back up production before a risky or destructive migration.
7. Apply migrations as an explicit release step before starting code that requires the new schema.
8. Verify the migration ledger and application health.

Do not use direct schema push commands in production. Do not edit an applied migration. Prefer a forward corrective migration; restore from a verified backup only when recovery is explicitly chosen.

## Seeds and content imports

The implemented local CLI and its complete input/update contract are documented in [Local Content Import](../development/content-import.md). Use `pnpm content:import --target development --file content/examples/local-draft.json --dry-run` to preview the draft example without writes. Applying requires `--apply`; new publication additionally requires `--allow-publish`. The command only accepts the loopback development/test application roles and checks connected identity. It cannot execute production imports. Serializability conflicts fail for review; after a connection failure around commit, rerun dry-run to establish current state before retrying.

- Keep the implemented development and test seed entry points separate.
- Preserve fixed identifiers, timestamps, ordering, and reserved markers when extending local fixtures.
- Use small synthetic test fixtures without personal or production data and reset them only in the isolated test database.
- Keep production content out of automatic development and test seed flows.
- Route project, skill, and post imports through application validation and repository ports.
- Require an explicit target environment and confirmation before a CLI writes to production.
- Use reviewed content inputs and the internal import path as the default mechanism for promoting content to production.
- Reject development seed markers, test fixtures, unexpected draft publication, invalid relations, and conflicting stable slugs before a production write.
- Make production imports idempotent or provide deterministic conflict handling and a dry-run mode before launch.
- Never publish a draft merely because it was imported.

## Production promotion

Schema and content are separate release artifacts:

1. Commit and review the Drizzle SQL migration.
2. Validate fresh migration, upgrade, repository, and import behavior on the development Mac using isolated compatible databases.
3. Build the application image without production database access.
4. Back up production before a risky or destructive migration.
5. Apply migrations explicitly on the production Mac with migration credentials.
6. Run the reviewed content import with an explicit production target and confirmation.
7. Verify the migration ledger, constraints, row counts, representative repository reads, application health, and public behavior.

Do not use a development database dump as the routine schema or content deployment mechanism. Never transfer `/var/lib/postgresql/data`, Docker volumes, or physical PostgreSQL files between Macs.

## Initial bootstrap and disaster recovery

Prefer migrations plus the validated content import even for the first production release. A custom-format logical backup created with `pg_dump` and restored with `pg_restore` is allowed only when:

- a one-time initial bootstrap must preserve a sanitized and verified local database exactly; or
- disaster recovery uses an approved backup created from production.

For either case, record the source database identity, PostgreSQL and dump-tool versions, migration state, checksum, encryption method, creation time, and intended target. Transfer the artifact through an encrypted channel, keep it out of Git and images, and restore it into a new isolated database before any cutover. Recreate or map production roles deliberately instead of importing development credentials or privileges.

After public launch, never overwrite production with a development backup. Production becomes the only origin for operational recovery backups.

## Production backup policy

All routine recovery backups originate from production after launch.

- Create an encrypted PostgreSQL custom-format backup with `pg_dump` at least daily.
- Retain seven daily backups and four weekly backups.
- Store at least one backup copy off the application host.
- Create an additional backup immediately before destructive or high-risk migrations.
- Record backup time, database identity, tool version, checksum, storage location, and completion result without recording credentials.
- Monitor backup age and failure; a command exit code alone is not sufficient evidence of recoverability.

The initial recovery point objective is 24 hours. Revisit it when content publication frequency or business importance increases.

## Restore verification

Test restore before accepting irreplaceable production content and at least monthly afterward.

1. Select a backup by verified identity and checksum.
2. Restore with `pg_restore` into a new isolated compatible database, never over the active production database.
3. Run migration-ledger, row-count, constraint, and representative repository-read checks.
4. Start the application against the restored database in an isolated environment.
5. Verify representative project, skill, draft, and published-post behavior.
6. Record elapsed time, failures, and corrective actions.
7. Authorize any production cutover separately after restore evidence is reviewed.
8. Remove the isolated restore database only after evidence is retained and the exact target is confirmed.

Do not describe a backup as successful until this restore workflow has succeeded with a representative artifact.

## Production topology and access

- Keep PostgreSQL on a private Docker network with no public listener.
- Use least-privilege application credentials and separate elevated migration credentials when practical.
- Protect database administration tools with private access controls and do not include them in the public MVP surface.
- Back up persistent data outside the container lifecycle and document volume ownership.
- Never use a container volume or PostgreSQL data directory as a cross-host transfer artifact.
- Add connection limits, timeouts, health checks, graceful shutdown, and useful logs without query secrets or content bodies.
