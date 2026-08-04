# PostgreSQL Lifecycle

## Status

Approved operating policy. Exact package scripts, Compose service names, credentials, and executable commands will be finalized with the application and infrastructure scaffold.

## Environment separation

Maintain separate development, test, and production databases. Never run automated tests against development or production data.

Planned application-facing configuration:

- `DATABASE_URL` for the Next.js server and migration tooling
- A separate test database URL supplied only to PostgreSQL integration tests
- Container bootstrap values supplied through ignored environment files or a secret store

Provide safe placeholders in `.env.example`. Never expose database configuration through a `NEXT_PUBLIC_` variable.

## Local development

Run Next.js on the host for fast feedback and PostgreSQL through Docker Compose. Bind a development database port to localhost only when host access is required. Use a health check before migrations, seeds, or integration tests.

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

- Keep development and test seed entry points separate.
- Make seeds deterministic and idempotent where practical.
- Use small synthetic test fixtures without personal or production data.
- Keep production content out of automatic development and test seed flows.
- Route project, skill, and post imports through application validation and repository ports.
- Require an explicit target environment and confirmation before a CLI writes to production.
- Never publish a draft merely because it was imported.

## Production backup policy

- Create an encrypted PostgreSQL custom-format backup at least daily.
- Retain seven daily backups and four weekly backups.
- Store at least one backup copy off the application host.
- Create an additional backup immediately before destructive or high-risk migrations.
- Record backup time, database identity, tool version, checksum, storage location, and completion result without recording credentials.
- Monitor backup age and failure; a command exit code alone is not sufficient evidence of recoverability.

The initial recovery point objective is 24 hours. Revisit it when content publication frequency or business importance increases.

## Restore verification

Test restore before accepting irreplaceable production content and at least monthly afterward.

1. Select a backup by verified identity and checksum.
2. Restore into a new isolated database, never over the active production database.
3. Run migration-ledger, row-count, constraint, and representative repository-read checks.
4. Start the application against the restored database in an isolated environment.
5. Verify representative project, skill, draft, and published-post behavior.
6. Record elapsed time, failures, and corrective actions.
7. Remove the isolated restore database only after evidence is retained and the exact target is confirmed.

Do not describe a backup as successful until this restore workflow has succeeded with a representative artifact.

## Production topology and access

- Keep PostgreSQL on a private Docker network with no public listener.
- Use least-privilege application credentials and separate elevated migration credentials when practical.
- Protect database administration tools with private access controls and do not include them in the public MVP surface.
- Back up persistent data outside the container lifecycle and document volume ownership.
- Add connection limits, timeouts, health checks, graceful shutdown, and useful logs without query secrets or content bodies.
