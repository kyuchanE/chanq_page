# Project Skill Instructions

Each child directory is one reusable project procedure with a required `SKILL.md` and generated UI metadata in `agents/openai.yaml`.

- Use lowercase kebab-case skill names that match their folder.
- Put all invocation triggers in the frontmatter `description`.
- Write body instructions in imperative form and keep them under 500 lines.
- Link to authoritative project docs and root scripts instead of copying their contents.
- Add bundled resources only when they eliminate repeated work.
- Run the skill validator and `./scripts/check.sh` after changes.
- Do not add auxiliary README, changelog, or installation files inside a skill.
