# PostgreSQL Instructions

PostgreSQL is deferred until a documented product need passes the adoption gate.

- Model domain data and invariants before designing tables.
- Keep migrations forward, reviewed, deterministic, and safe for the deployed application sequence.
- Do not edit an applied migration; add a new migration.
- Use constraints for database invariants and transactions for atomic changes.
- Keep the database private and use least-privilege roles.
- Define backup, retention, restore, and restore-test procedures before production writes.
- Test repository adapters against a real compatible PostgreSQL instance when SQL behavior matters.
- Preserve public content slugs and SEO metadata during any MDX migration.
