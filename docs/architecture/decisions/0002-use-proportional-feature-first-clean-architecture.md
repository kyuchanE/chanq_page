# ADR-0002: Use Proportional Feature-First Clean Architecture

## Status

Accepted

## Context

The project should demonstrate sound architecture, but its MVP is a content-focused portfolio. A global four-layer structure can scatter one feature across the repository and encourage empty interfaces, pass-through use cases, and dependency injection that add ceremony without protecting a real rule.

The system still needs clear separation between framework entry points, business rules, external adapters, and shared primitives as dynamic capabilities are introduced later.

## Decision

Organize application code by feature. Within a feature, introduce `domain`, `application`, `infrastructure`, and `presentation` boundaries only as required by current rules, side effects, volatility, or test seams.

Keep Next.js route composition in `src/app/`. Keep feature-neutral primitives in `src/shared/`. Enforce inward dependency direction and translate framework or external types at adapters.

## Alternatives considered

- **Global technical layers:** rejected because feature changes would cross distant folders and the small MVP would accumulate ceremonial abstractions.
- **All logic inside App Router files:** rejected because growing server actions, content rules, or persistence would become coupled to Next.js entry points.
- **Unstructured feature folders:** rejected because dependency direction and adapter ownership would be ambiguous.

## Consequences

- Simple static pages remain simple.
- Complex features can gain explicit boundaries without reorganizing unrelated code.
- Reviewers must judge whether each abstraction protects a real variation or rule.
- Cross-feature imports require care; reusable stable concepts move to `src/shared/`, while feature orchestration stays explicit.
- Architecture tests should be added when application imports exist and boundary drift becomes mechanically detectable.

## Revisit when

Revisit if the project grows into multiple independently deployed services, a large team needs stronger module enforcement, or repeated cross-feature workflows demonstrate that the current boundaries are inadequate.
