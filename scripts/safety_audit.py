#!/usr/bin/env python3
"""Safety audit for this repo. Run before every push.

A DETECTION tool: false negatives (a real leak that stays silent) are the
failure mode that matters, not false positives. Every check below is a
"must come up empty" check -- exit 0 with no output when the repo is clean;
otherwise print every finding and exit non-zero.

Checks:
  1. tracked-file extension check -- no spreadsheet/archive/compiled-binary
     extensions tracked.
  2. text scan -- every tracked *.md *.yml *.yaml *.py *.html *.xml *.json
     file, line by line, for leaked Moodle submission-path text, ATU
     student ID numbers, or 32-char hex tokens. Three known-safe shapes
     are exact or length-bounded regexes: a Classroom invite/invitation
     URL (an exact whitelist for the open-ended /classrooms/ slug shape,
     length bounds for the other two fixed-shape ones -- see
     CLASSROOMS_WHITELIST below), the literal pattern-quoting text this
     file's own regex is built from, and the backtick-quoted mention of
     that text used in prose elsewhere in the repo. A sensitive match is
     suppressed ONLY when its entire span lies within one safe-shape span
     on the SAME (unmodified) line -- the line is never mutated and never
     dropped whole, so a real token glued directly onto, or merely
     sharing a line with, a safe shape still surfaces. This file's own
     source contains all three shapes verbatim and clears itself through
     this exact mechanism -- it is not exempted by name anywhere below.
  3. top-level allowlist -- every tracked path lives under one of the
     documented top-level entries.
  4. pptx placement -- every tracked .pptx lives under */lecture/original/.
  5. pptx internals -- every tracked .pptx is opened as a zip; every
     .xml/.rels member is decoded and put through the same text scan as
     check 2 (PowerPoint can carry hidden reviewer comments/notes that
     the Markdown deck never surfaces); any member that is itself an
     embedded office/binary object (an `embeddings/` path, or an
     .xlsx/.xls/.docx/.doc/.bin extension) is reported directly for
     manual inspection instead, since its content can't be meaningfully
     text-scanned.

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
# Check 2 / 5: sensitive text patterns, and the known-safe shapes checked
# for span-containment before a match is flagged. Kept to exactly three:
# a Classroom URL, the literal pattern-quoting text, and its backticked
# mention. Each is an exact or length-bounded regex -- never a bare `\S+`
# or an unconditional substring strip -- so a real token glued directly
# onto one of these shapes (no separating whitespace) still extends past
# its span and gets reported; only content genuinely and fully inside the
# shape is suppressed.
TEXT_SCAN_GLOBS = ("*.md", "*.yml", "*.yaml", "*.py", "*.html", "*.xml", "*.json")
SENSITIVE_RE = re.compile(r"assignsubmission|G00[0-9]{6}|\b[0-9a-f]{32}\b", re.IGNORECASE)

# Classroom URL shapes:
#   /a/<code>                     -- short invite code, 8 chars in practice,
#                                     length-bounded (never "or more").
#   /assignment-invitations/<hex> -- documented as a 32-hex id (also
#                                     matches the 32-hex sensitive pattern,
#                                     which is exactly why this exemption
#                                     exists: it's a shareable link, not a
#                                     secret), exact 32 (not "32 or more").
#   /classrooms/<slug>            -- classroom slugs are open-ended free
#                                     text, not a fixed shape, so (unlike
#                                     the other two) this is an EXACT
#                                     LITERAL whitelist, not a length
#                                     bound: a length bound loose enough to
#                                     cover a realistic slug (e.g. 64
#                                     chars) is also loose enough to fully
#                                     swallow a glued-on id or hex token,
#                                     which is exactly what happened here
#                                     in the first round of this fix: a
#                                     student-id-shaped suffix glued onto
#                                     the slug with `[A-Za-z0-9-]{1,64}`
#                                     was silently swallowed and suppressed
#                                     whole. Add a slug here ONLY when it's
#                                     genuinely referenced in this repo
#                                     (currently just the one in README's
#                                     related-repos table); an unlisted
#                                     classrooms/ URL gets no exemption at
#                                     all and surfaces for review -- a
#                                     deliberate friction, not a bug.
# Each /a/ and /assignment-invitations/ bound is chosen so it can never
# fully cover an adjacent, glued-on sensitive match (shortest is G00 + 6
# digits = 9 chars): both are comfortably under or exactly that, so any
# extra glued content starts outside the safe span. Each classrooms/
# whitelist entry is followed by a negative lookahead requiring the next
# character (if any) NOT be alphanumeric/hyphen, so 'classrooms/<slug>'
# glued directly to more alnum content (an id, a different slug, hex)
# doesn't match the safe shape AT ALL -- the whole line is then scanned
# with no exemption there, rather than relying on a truncated-but-still-
# partial-match being merely "not fully contained".
CLASSROOMS_WHITELIST = (
    "REDACTED",  # README.md related-repos table: OOC GitHub Classroom
)
CLASSROOM_URL_SAFE_RE = re.compile(
    r"https://classroom\.github\.com/(?:"
    r"a/[A-Za-z0-9_-]{1,8}"
    r"|assignment-invitations/[0-9a-f]{32}"
    r"|classrooms/(?:" + "|".join(re.escape(slug) for slug in CLASSROOMS_WHITELIST) + r")(?![A-Za-z0-9-])"
    r")"
)
PATTERN_QUOTE = "assignsubmission|G00"
BACKTICK_QUOTE = "`assignsubmission`"
SAFE_SPAN_PATTERNS = (
    CLASSROOM_URL_SAFE_RE,
    re.compile(re.escape(PATTERN_QUOTE)),
    re.compile(re.escape(BACKTICK_QUOTE)),
)
CONTEXT_RADIUS = 40  # chars of context kept either side of a match in output

# ---------------------------------------------------------------------------
# Check 3: only these top-level paths may be tracked.
TOP_LEVEL_ALLOW_RE = re.compile(
    r"^(\.github/|\.gitignore$|README\.md$|CLAUDE\.md$|docs/|module/|scripts/|weeks/"
    r"|themes/|\.vscode/|\.devcontainer/|labs/|practice/|package\.json$|package-lock\.json$)"
)

# ---------------------------------------------------------------------------
# Check 4 / 5: pptx placement and internals.
PPTX_ALLOWED_SEGMENT = "/lecture/original/"
EMBEDDED_OBJECT_EXTENSIONS = (".xlsx", ".xls", ".docx", ".doc", ".bin")


def git_ls_files(*pathspecs: str) -> list[str]:
    """Tracked paths (repo-relative, forward slashes) matching pathspecs."""
    cmd = ["git", "ls-files", *pathspecs]
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", check=True
    )
    return [line for line in result.stdout.splitlines() if line]


def safe_spans(line: str) -> list[tuple[int, int]]:
    """Start/end offsets of every known-safe shape occurring in line."""
    spans = []
    for pattern in SAFE_SPAN_PATTERNS:
        for match in pattern.finditer(line):
            spans.append((match.start(), match.end()))
    return spans


def _snippet(line: str, match: re.Match) -> str:
    start = max(0, match.start() - CONTEXT_RADIUS)
    end = min(len(line), match.end() + CONTEXT_RADIUS)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(line) else ""
    return prefix + line[start:end].strip() + suffix


def scan_text_for_leaks(text: str) -> list[tuple[int, str]]:
    """(line_number, context) for every real leak in text.

    SENSITIVE_RE runs over each ORIGINAL line -- it is never mutated. A
    match is suppressed only when its entire span lies within one of that
    line's known-safe spans (see safe_spans); a match that merely starts
    inside a safe span but extends past its end is still reported. Every
    match on every line is reported (not just the first), since a false
    negative here is the failure mode that matters.
    """
    hits: list[tuple[int, str]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        spans = safe_spans(line)
        for match in SENSITIVE_RE.finditer(line):
            if any(s <= match.start() and match.end() <= e for s, e in spans):
                continue
            hits.append((lineno, _snippet(line, match)))
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
                for member in archive.namelist():
                    lower = member.lower()
                    if "embeddings/" in lower or lower.endswith(EMBEDDED_OBJECT_EXTENSIONS):
                        findings.append(
                            f"embedded object inside {rel_path}: {member} -- inspect manually"
                        )
                        continue
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
