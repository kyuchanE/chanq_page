# Script Instructions

Scripts provide repeatable, deterministic mechanics that should not depend on Codex remembering a checklist.

- Use repository-relative behavior derived from the script location, not the caller's working directory.
- Default to read-only validation. Require explicit arguments and confirmation for mutations.
- Use strict error handling, quoted variables, meaningful exit codes, and concise English output.
- Avoid secrets, network access, interactive prompts, and machine-specific paths unless the script's documented purpose requires them.
- Provide `--help` for scripts with options.
- Keep orchestration small; place business rules in application code and procedures in skills.
- Execute every new or changed script on both a success case and a representative failure case when practical.
