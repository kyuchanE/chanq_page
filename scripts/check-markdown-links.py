#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_DIRECTORIES = {".git", ".next", "node_modules", "coverage", "out"}
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")


def markdown_files() -> list[Path]:
    return sorted(
        path
        for path in REPOSITORY_ROOT.rglob("*.md")
        if not EXCLUDED_DIRECTORIES.intersection(path.relative_to(REPOSITORY_ROOT).parts)
    )


def local_target(raw_target: str) -> str | None:
    target = raw_target.strip()
    if target.startswith("<") and ">" in target:
        target = target[1 : target.index(">")]
    else:
        target = target.split(maxsplit=1)[0]

    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or target.startswith(("#", "mailto:", "tel:")):
        return None

    return unquote(parsed.path)


def main() -> int:
    failures: list[str] = []

    for markdown_file in markdown_files():
        text = markdown_file.read_text(encoding="utf-8")
        for match in MARKDOWN_LINK.finditer(text):
            target = local_target(match.group(1))
            if not target:
                continue

            resolved = (markdown_file.parent / target).resolve()
            if not resolved.exists():
                source = markdown_file.relative_to(REPOSITORY_ROOT)
                failures.append(f"{source}: missing local link target '{target}'")

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        print(f"Markdown link validation failed with {len(failures)} error(s).", file=sys.stderr)
        return 1

    print("Local Markdown links are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
