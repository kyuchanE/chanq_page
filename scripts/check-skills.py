#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
SKILLS_ROOT = REPOSITORY_ROOT / ".agents" / "skills"
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)
VALID_NAME = re.compile(r"\A[a-z0-9]+(?:-[a-z0-9]+)*\Z")


def parse_frontmatter(text: str) -> dict[str, str] | None:
    match = FRONTMATTER.match(text)
    if not match:
        return None

    values: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            return None
        key, value = line.split(":", maxsplit=1)
        key = key.strip()
        if key in values:
            return None
        values[key] = value.strip()
    return values


def parse_interface(text: str) -> dict[str, str] | None:
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines or lines[0] != "interface:":
        return None

    values: dict[str, str] = {}
    for line in lines[1:]:
        match = re.fullmatch(r"  ([a-z_]+): (.+)", line)
        if not match:
            return None
        try:
            value = json.loads(match.group(2))
        except json.JSONDecodeError:
            return None
        if not isinstance(value, str):
            return None
        key = match.group(1)
        if key in values:
            return None
        values[key] = value
    return values


def main() -> int:
    failures: list[str] = []

    for skill_directory in sorted(path for path in SKILLS_ROOT.iterdir() if path.is_dir()):
        folder_name = skill_directory.name
        skill_file = skill_directory / "SKILL.md"
        metadata_file = skill_directory / "agents" / "openai.yaml"

        if not skill_file.is_file():
            failures.append(f"{folder_name}: SKILL.md is missing")
            continue

        content = skill_file.read_text(encoding="utf-8")
        frontmatter = parse_frontmatter(content)
        if frontmatter is None:
            failures.append(f"{folder_name}: YAML frontmatter is missing or malformed")
            continue
        if set(frontmatter) != {"name", "description"}:
            failures.append(f"{folder_name}: frontmatter must contain only name and description")
            continue

        name = frontmatter["name"]
        description = frontmatter["description"]
        if name != folder_name:
            failures.append(f"{folder_name}: name must match the folder")
        if not VALID_NAME.fullmatch(name):
            failures.append(f"{folder_name}: name must be lowercase kebab-case")
        if len(name) > 64:
            failures.append(f"{folder_name}: name exceeds 64 characters")
        if not description:
            failures.append(f"{folder_name}: description must be non-empty")
        if len(description) > 1_024:
            failures.append(f"{folder_name}: description exceeds 1,024 characters")
        if "<" in description or ">" in description:
            failures.append(f"{folder_name}: description contains an angle bracket")
        if "[TODO" in content:
            failures.append(f"{folder_name}: template TODO text remains")

        if not metadata_file.is_file():
            failures.append(f"{folder_name}: agents/openai.yaml is missing")
            continue

        interface = parse_interface(metadata_file.read_text(encoding="utf-8"))
        if interface is None:
            failures.append(f"{folder_name}: openai.yaml interface is malformed")
            continue
        required_interface = {"display_name", "short_description", "default_prompt"}
        if set(interface) != required_interface:
            failures.append(f"{folder_name}: openai.yaml must contain the three required interface strings")
            continue

        short_description = interface["short_description"]
        default_prompt = interface["default_prompt"]
        if not 25 <= len(short_description) <= 64:
            failures.append(f"{folder_name}: short_description must contain 25 to 64 characters")
        if f"${folder_name}" not in default_prompt:
            failures.append(f"{folder_name}: default_prompt must invoke ${folder_name}")

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        print(f"Skill validation failed with {len(failures)} error(s).", file=sys.stderr)
        return 1

    print("Project-local skills are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
