# Architecture Documentation Instructions

Describe the architecture that exists now and label proposed architecture clearly. Keep boundary names aligned with actual directories and imports.

- Document dependency direction, data flow, trust boundaries, and runtime ownership.
- Prefer proportional design; explain why an abstraction or service exists.
- Add or update an ADR for durable choices affecting multiple features, data ownership, security, deployment, or difficult migrations.
- Update `system-overview.md` when the implemented topology changes.
- Do not use architecture diagrams as decoration; keep them small and testable against the repository.
