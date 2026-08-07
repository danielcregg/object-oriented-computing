#!/usr/bin/env python3
"""Safety audit for this repo. Run before every push.

A DETECTION tool: false negatives (a real leak that stays silent) are the
failure mode that matters, not false positives. Every check below is a
"must come up empty" check -- exit 0 with no output when the repo is clean;
otherwise print every finding and exit non-zero.

Checks:
  1. tracked-file extension check -- no spreadsheet/archive/compiled-binary
     extensions tracked.
  2. text scan -- every tracked *.md *.yml *.py *.html *.xml *.json file,
     line by line, for leaked Moodle submission-path text, ATU student ID
     numbers, or 32-char hex tokens. Three known-safe shapes are stripped
     from a copy of each line before it is re-tested (never the whole
     line): a Classroom invite URL, the literal pattern-quoting text this
     file's own regex is built from, and the backtick-quoted mention of
     that text used in prose elsewhere in the repo. Stripping is surgical
     substring/URL removal, not whole-line exclusion, so a real token
     sharing a line with a Classroom URL still surfaces. This file's own
     source contains those same three shapes and clears itself through
     this exact mechanism -- it is not exempted by name anywhere below.
  3. top-level allowlist -- every tracked path lives under one of the
     documented top-level entries.
  4. pptx placement -- every tracked .pptx lives under */lecture/original/.
  5. pptx internals -- every tracked .pptx is opened as a zip and every
     .xml/.rels member is decoded and put through the same text scan as
     check 2 (PowerPoint can carry hidden reviewer comments/notes that
     the Markdown deck never surfaces).

Usage (from repo root): python scripts/safety_audit.py
"""
from __future__ import annotations

import re
import subprocess
import sys
import zipfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Check 1: tracked-file extensions that must never be committed.
BAD_EXTENSION_RE = re.compile(r"\.(xlsx|xls|mbz|zip|class|jar)$", re.IGNORECASE)

# ---------------------------------------------------------------------------
# Check 2 / 5: sensitive text patterns, and the known-safe shapes stripped
# from a line before it is re-tested. Kept to exactly three: a Classroom
# URL, the literal pattern-quoting text, and its backticked mention.
TEXT_SCAN_GLOBS = ("*.md", "*.yml", "*.py", "*.html", "*.xml", "*.json")
SENSITIVE_RE = re.compile(r"assignsubmission|G00[0-9]{6}|\b[0-9a-f]{32}\b", re.IGNORECASE)
CLASSROOM_URL_RE = re.compile(r"https://classroom\.github\.com/\S+")
PATTERN_QUOTE = "assignsubmission|G00"
BACKTICK_QUOTE = "`assignsubmission`"
CONTEXT_RADIUS = 40  # chars of context kept either side of a match in output

# ---------------------------------------------------------------------------
# Check 3: only these top-level paths may be tracked.
TOP_LEVEL_ALLOW_RE = re.compile(
    r"^(\.github/|\.gitignore$|README\.md$|CLAUDE\.md$|docs/|module/|scripts/|weeks/)"
)

# ---------------------------------------------------------------------------
# Check 4 / 5: pptx placement.
PPTX_ALLOWED_SEGMENT = "/lecture/original/"


def git_ls_files(*pathspecs: str) -> list[str]:
    """Tracked paths (repo-relative, forward slashes) matching pathspecs."""
    cmd = ["git", "ls-files", *pathspecs]
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", check=True
    )
    return [line for line in result.stdout.splitlines() if line]


def strip_known_safe(line: str) -> str:
    """Remove the three known-safe shapes; the caller re-tests what remains."""
    line = CLASSROOM_URL_RE.sub("", line)
    line = line.replace(PATTERN_QUOTE, "")
    line = line.replace(BACKTICK_QUOTE, "")
    return line


def _snippet(remainder: str, match: re.Match) -> str:
    start = max(0, match.start() - CONTEXT_RADIUS)
    end = min(len(remainder), match.end() + CONTEXT_RADIUS)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(remainder) else ""
    return prefix + remainder[start:end].strip() + suffix


def scan_text_for_leaks(text: str) -> list[tuple[int, str]]:
    """(line_number, context) for every real leak in text.

    Each line has the three known-safe shapes stripped from a *copy*, and
    the remainder is re-tested -- so a real token sharing a line with,
    say, a Classroom URL still surfaces. Every match on every line is
    reported (not just the first), since a false negative here is the
    failure mode that matters.
    """
    hits: list[tuple[int, str]] = []
    for lineno, raw_line in enumerate(text.splitlines(), start=1):
        remainder = strip_known_safe(raw_line)
        for match in SENSITIVE_RE.finditer(remainder):
            hits.append((lineno, _snippet(remainder, match)))
    return hits


def read_text_relaxed(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def check_bad_extensions() -> list[str]:
    return [
        f"{path}: disallowed tracked extension"
        for path in git_ls_files()
        if BAD_EXTENSION_RE.search(path)
    ]


def check_text_scan() -> list[str]:
    findings = []
    for rel_path in git_ls_files(*TEXT_SCAN_GLOBS):
        path = Path(rel_path)
        if not path.is_file():
            continue  # tracked-but-deleted in the working tree; nothing to scan
        text = read_text_relaxed(path)
        for lineno, snippet in scan_text_for_leaks(text):
            findings.append(f"{rel_path}:{lineno}: {snippet}")
    return findings


def check_top_level_allowlist() -> list[str]:
    return [
        f"{path}: not under an allowed top-level path"
        for path in git_ls_files()
        if not TOP_LEVEL_ALLOW_RE.match(path)
    ]


def check_pptx_placement() -> list[str]:
    return [
        f"{path}: pptx must live under */lecture/original/"
        for path in git_ls_files()
        if path.lower().endswith(".pptx") and PPTX_ALLOWED_SEGMENT not in path
    ]


def check_pptx_internals() -> list[str]:
    findings = []
    for rel_path in git_ls_files():
        if not rel_path.lower().endswith(".pptx"):
            continue
        path = Path(rel_path)
        if not path.is_file():
            continue
        try:
            with zipfile.ZipFile(path) as archive:
                members = archive.namelist()
                for member in members:
                    lower = member.lower()
                    if not (lower.endswith(".xml") or lower.endswith(".rels")):
                        continue
                    text = archive.read(member).decode("utf-8", errors="ignore")
                    for lineno, snippet in scan_text_for_leaks(text):
                        findings.append(f"{rel_path}!{member}:{lineno}: {snippet}")
        except zipfile.BadZipFile as exc:
            findings.append(f"{rel_path}: could not open as zip ({exc})")
    return findings


def main() -> int:
    # Windows consoles default to a legacy codepage that cannot encode
    # every character read out of a decoded pptx part; never let a print
    # crash the audit itself.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    findings: list[str] = []
    findings += check_bad_extensions()
    findings += check_text_scan()
    findings += check_top_level_allowlist()
    findings += check_pptx_placement()
    findings += check_pptx_internals()

    for line in findings:
        print(line)

    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
