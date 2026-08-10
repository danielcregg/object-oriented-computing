#!/usr/bin/env python3
"""Check that every relative link in the tracked Markdown actually resolves.

Why this exists: when the redundant `lecture/` level was removed from the
week folders, all nine lecture links in README's schedule table kept
pointing at `weeks/*/lecture/slides.md`. Every CI gate stayed green -- they
check Java, the practice bank and leaked data, none of them links -- so the
repo's front page shipped nine 404s. A derived layout (week folder -> deck,
topic -> lab package) means a rename on either side silently breaks prose
that names the old path, and prose is exactly what nothing else validates.

Checks relative link and image targets only. External URLs are NOT fetched:
a link checker that hits the network turns an unrelated outage into a red
build, and the failure this guards against is internal renames.

Anchors (`#section`) are checked as far as the file existing; the fragment
itself is not resolved.

Run from the repo root:  python scripts/check_links.py
Prints one line per broken link and exits 1; silent + exit 0 when clean.
"""
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

# [text](target) and ![alt](target), with an optional "title" after the target.
LINK_RE = re.compile(r'!?\[[^\]]*\]\(\s*([^)\s]+?)\s*(?:"[^"]*")?\)')
FENCE_RE = re.compile(r"^\s*(```|~~~)")
# Schemes and in-page anchors that are not filesystem paths.
NON_PATH_PREFIXES = ("http://", "https://", "mailto:", "tel:", "sip:",
                     "data:", "ftp://", "#", "//")


def tracked_markdown() -> list[str]:
    out = subprocess.run(["git", "ls-files", "*.md"],
                         capture_output=True, text=True, check=True)
    return [p for p in out.stdout.splitlines() if p]


def links_outside_code(text: str):
    """Yield (line_number, target) for links that are not inside a fence.

    Fenced blocks are skipped: a deck or lab often shows Markdown syntax as
    an EXAMPLE, and an example link is not a promise that the file exists.
    """
    in_fence = False
    for lineno, line in enumerate(text.split("\n"), start=1):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for target in LINK_RE.findall(line):
            yield lineno, target


def broken_links() -> list[str]:
    findings = []
    for rel_path in tracked_markdown():
        path = Path(rel_path)
        if not path.is_file():
            continue  # tracked-but-deleted in the working tree
        for lineno, target in links_outside_code(path.read_text(encoding="utf-8")):
            if target.startswith(NON_PATH_PREFIXES):
                continue
            dest = unquote(target.split("#", 1)[0])
            if not dest:
                continue  # a bare "#anchor" -- same file
            if not (path.parent / dest).exists():
                findings.append(f"{rel_path}:{lineno}: broken link -> {target}")
    return findings


def main() -> int:
    findings = broken_links()
    for line in findings:
        print(line)
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
