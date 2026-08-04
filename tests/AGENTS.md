# Test Instructions

Use tests to protect behavior and boundaries, not implementation trivia.

- Keep pure domain and application tests fast and deterministic.
- Use integration tests for adapters, content parsing, database behavior, and framework boundaries.
- Use end-to-end tests for a small number of critical visitor journeys.
- Control time, randomness, network access, and external services.
- Use fixtures that contain no production secrets or personal data.
- Name tests by observable behavior and include regression coverage with bug fixes.
- Do not weaken production design solely to expose internals to a test.
