# Test Instructions

Use tests to protect behavior and boundaries, not implementation trivia.

- Keep pure domain and application tests fast and deterministic.
- Use integration tests for adapters, content import validation, database behavior, migrations, and framework boundaries.
- Use end-to-end tests for a small number of critical visitor journeys.
- Control time, randomness, network access, and external services.
- Use fixtures that contain no production secrets or personal data.
- Name tests by observable behavior and include regression coverage with bug fixes.
- Do not weaken production design solely to expose internals to a test.

## Unit tests

- Test pure policies, transformations, validation, and application orchestration.
- Prefer real value objects and small fakes over broad mocks.
- Cover observable boundaries and failure behavior, not private call order.

## Integration tests

- Test real boundaries such as Markdown import validation, route adapters, PostgreSQL repositories, migrations, and rendered configuration.
- Use isolated temporary state, deterministic setup and cleanup, and production-compatible dependency versions.
- Assert externally visible data and behavior instead of unstable framework snapshots.

## End-to-end tests

- Cover only critical public journeys, direct URL access, and 404 behavior against a production-like build.
- Include keyboard and high-value accessibility checks.
- Prefer stable roles and labels, keep tests independent, and avoid arbitrary sleeps.
- Capture actionable failure artifacts without secrets.
