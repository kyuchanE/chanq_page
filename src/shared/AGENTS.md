# Shared Source Instructions

Place code here only after it is stable, feature-neutral, and used by more than one feature or is a true platform primitive.

- Prefer small subdirectories such as `ui`, `config`, `validation`, or `lib` when real files justify them.
- Shared modules must not import from `src/features/`.
- Shared UI must remain accessible, composable, and free of feature-specific copy or policy.
- Keep environment parsing server-only when values are secret.
- Do not create generic helpers that hide domain meaning; a small duplication is often safer than premature coupling.
