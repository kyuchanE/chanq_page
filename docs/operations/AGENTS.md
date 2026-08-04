# Operations Documentation Instructions

Write safe runbooks for build, startup, health verification, deployment, rollback, backup, restore, networking, and cache invalidation.

- Separate local, staging, and production assumptions.
- Use placeholders for domains, tokens, credentials, and host paths.
- Prefer read-only diagnostics before mutation.
- Include success signals, failure signals, and recovery steps.
- Identify the owner and source of truth for every cache and persistent volume.
- Never document a production-destructive command without an explicit backup and confirmation step.
