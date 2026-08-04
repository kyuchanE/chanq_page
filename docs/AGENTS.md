# Documentation Instructions

This directory is the maintained project knowledge base. Keep `index.md` as the complete navigation entry point and link every durable document from it.

- Describe the present system in present tense and planned work explicitly as planned.
- Separate product requirements, architecture, development workflow, and operations.
- Prefer one authoritative explanation over duplicated guidance.
- Include dates only when history matters; use Git for ordinary change history.
- Use diagrams only when they clarify boundaries, dependencies, or a multi-step flow.
- Check relative links with `./scripts/check-markdown-links.py` after documentation changes.
- Update affected docs in the same change as code or configuration.

Do not place agent procedures here; reusable Codex procedures belong in `.agents/skills/`.
