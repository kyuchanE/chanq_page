# Integration Test Instructions

- Test real boundaries such as MDX parsing, route adapters, PostgreSQL queries, migrations, and configuration rendering.
- Use isolated temporary state and deterministic setup and cleanup.
- Match production dependency versions closely.
- Assert data and externally visible behavior; avoid snapshots of unstable framework output.
- Make unavailable external requirements explicit rather than silently skipping risk-critical tests.
