# Project Skill Instructions

Each child directory is one reusable project procedure with a required `SKILL.md` and generated UI metadata in `agents/openai.yaml`.

- Use lowercase kebab-case skill names that match their folder.
- Put all invocation triggers in the frontmatter `description`.
- Write body instructions in imperative form and keep them under 500 lines.
- Link to authoritative project docs and root scripts instead of copying their contents.
- Add bundled resources only when they eliminate repeated work.
- Run the skill validator and `./scripts/check.sh` after changes.
- Do not add auxiliary README, changelog, or installation files inside a skill.
- Keep each `agents/openai.yaml` aligned with its `SKILL.md`; quote strings, keep the short description concise, and make `default_prompt` explicitly invoke `$skill-name`.
- Do not add icons, colors, dependencies, or policy fields without a real requirement.
- Keep planning skills separate from implementation, validation skills read-only unless fixes are requested, implementation skills proportional to current boundaries, and operations skills read-only first with explicit recovery guidance.
