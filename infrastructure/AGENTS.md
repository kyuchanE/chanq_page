# Infrastructure Instructions

This directory owns versioned deployment and service configuration. Application policy belongs in `src/`; operating explanations and runbooks belong in `docs/operations/`.

- Keep local, test, and production differences explicit.
- Never commit credentials or production identifiers; provide safe examples.
- Pin intentional image versions and review upgrades.
- Use private networks, least privilege, health checks, resource limits where known, and graceful shutdown.
- Validate rendered configuration before starting or replacing services.
- Document operational behavior, recovery, and rollback with every consequential change.
- Do not add an infrastructure component until its adoption gate is documented and met.
