# ADR-0006: Separate Local PostgreSQL Application Roles

## Status

Accepted

## Context

The local PostgreSQL container was bootstrapped with a `root` database superuser, and both application and migration URLs initially used that role. Running repository behavior with superuser privileges would allow local tests to pass even when the future production application role lacks a required grant. It would also increase the impact of an application defect or unsafe query during development.

Development convenience still requires an elevated role for database creation, migrations, test reset, and role administration. The local environment must therefore preserve simple administration without making elevated privileges the normal application boundary.

## Decision

Separate local migration and application access:

- Keep the local `root` PostgreSQL role for bootstrap, migrations, reset, and role administration only.
- Use `chanq_page_app` for routine application access to the `chanq_page` development database.
- Use `chanq_page_test_app` for integration access to the `chanq_page_test` database.
- Deny each application role access to the other environment's database.
- Grant application roles `USAGE` on the `public` schema and `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on current and future application tables.
- Grant only required sequence usage and deny database/schema creation, superuser, database creation, role creation, replication, and row-level-security bypass privileges.
- Keep the Drizzle migration ledger inaccessible to application roles.
- Provision roles idempotently for both fresh and existing local volumes.
- Store actual local passwords only in ignored `.env.local`; track role names and safe password placeholders in `.env.example`.
- Use separate migration URLs and application URLs so tooling cannot silently migrate with application credentials.

Deterministic development seeds and test fixtures will use application-level DML after elevated setup/reset work is complete.

## Alternatives considered

- **Use `root` for all local work:** rejected because it hides privilege regressions and exercises a different security boundary from production.
- **Use one shared application role for development and test:** rejected because it weakens database isolation and makes accidental cross-environment access harder to detect.
- **Recreate the local volume to add roles:** rejected because role provisioning can be applied safely and idempotently without deleting existing local data.

## Consequences

- Local setup has additional credentials and an explicit role-provisioning command.
- Migrations continue to use the elevated local role, while schema and repository integration checks can exercise application permissions.
- New migration-created tables receive application grants through default privileges owned by `root`.
- Permission tests must continue to verify DML access, DDL denial, migration-ledger denial, and cross-database isolation.
- Local application passwords are development secrets and must never be copied to production.

## Revisit when

Revisit role names, grants, or connection limits when repository behavior requires new PostgreSQL capabilities, row-level security is introduced, separate read/write roles become useful, or the production credential model is implemented.
