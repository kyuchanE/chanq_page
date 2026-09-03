# Feature Instructions

Organize behavior by user-facing capability, for example `projects`, `articles`, or `contact`. Each feature exposes a small public surface and owns its private implementation.

Use only the layers justified by the feature:

- `domain/`: entities, value objects, policies, and pure invariants; no framework imports.
- `application/`: use cases, commands, queries, and ports; depends on domain.
- `infrastructure/`: content, database, network, or platform adapters; implements inward ports.
- `presentation/`: feature-specific components, view models, and input mapping; calls application behavior.

Avoid pass-through use cases and one-implementation interfaces unless they protect a real volatility boundary or enable a valuable isolated test. A feature must not import another feature's private files. Coordinate features in `src/app/` or through an explicitly documented shared contract.

## Content detail policy

- Keep the project/post Markdown contract in the `content` feature and follow the [authoring policy](../../docs/development/content-authoring.md). Reuse one controlled renderer across all three detail routes; do not move content-specific policy into `src/shared/`.
- Keep parsing and filesystem adapters outside domain/application code. Validate imports and defend public rendering independently; stored Markdown must never enable raw HTML, executable MDX, or arbitrary attributes.
- Keep detail text server-rendered. Isolate GIF playback state in the smallest client leaf, retaining a usable static poster without JavaScript.
