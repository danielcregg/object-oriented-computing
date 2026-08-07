#!/usr/bin/env python3
"""Split the full Moodle question-bank export into per-MCQ-week files.

Moodle XML sets the active category with <question type="category"> markers;
every following question belongs to that category until the next marker.
Each output file keeps its subtree's markers, so it re-imports cleanly.

Before writing, every MCQ bucket is validated against the full export
itself, with two independent checks (not one arithmetic identity that
would hold by construction regardless of misrouting):
  - the export contains a category marker with EXACTLY the bucket's root
    text ($course$/top/KEY) -- a renamed or deleted root aborts here, by
    name, even in the case where every remaining question would still
    happen to land in the right bucket;
  - the bucket itself has at least one category marker and at least one
    question.
If validation fails, the script aborts and writes nothing. Each output
file that does get written goes through a temp file + os.replace so a
file is never left half-written, and per-bucket question/category counts
are always printed on success so drift is visible in CI logs/diffs.

Usage (from repo root): python scripts/split_question_bank.py
Testing against a scratch copy (never touches the real repo files):
    python scripts/split_question_bank.py --src SCRATCH.xml --out-dir SCRATCH_DIR
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

SRC = "module/question-bank/full-export-2025-26.xml"
TARGETS = {
    "MCQ1": "weeks/week-05-mcq1/questions.xml",
    "MCQ2": "weeks/week-09-mcq2/questions.xml",
    "MCQ3": "weeks/week-13-mcq3/questions.xml",
}


def bucket_for(category_path: str) -> str | None:
    for key in TARGETS:
        prefix = f"$course$/top/{key}"
        if category_path == prefix or category_path.startswith(prefix + "/"):
            return key
    return None


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split the full Moodle question-bank export into per-MCQ-week files."
    )
    parser.add_argument(
        "--src", type=Path, default=Path(SRC),
        help="full export XML to split (default: %(default)s)",
    )
    parser.add_argument(
        "--out-dir", type=Path, default=Path("."),
        help="base directory the per-week paths are written under (default: current dir)",
    )
    return parser.parse_args(argv)


def split(root: ET.Element) -> dict[str, list[ET.Element]]:
    """Bucket every <question> under its MCQ target.

    Anything outside MCQ1/MCQ2/MCQ3 (the shared Sample/Mike's CodeRunner
    banks) belongs to none of the three output files and is dropped here.
    """
    buckets: dict[str, list[ET.Element]] = {key: [] for key in TARGETS}
    current: str | None = None
    for q in root.findall("question"):
        if q.get("type") == "category":
            current = bucket_for(q.find("category/text").text or "")
        if current:
            buckets[current].append(q)
    return buckets


def category_texts(root: ET.Element) -> set[str]:
    """Every distinct <question type="category"> marker text in the export."""
    return {
        q.find("category/text").text or ""
        for q in root.findall("question")
        if q.get("type") == "category"
    }


def validate(buckets: dict[str, list[ET.Element]], present_categories: set[str]) -> list[str]:
    """Return human-readable errors; an empty list means it's safe to write."""
    errors = []
    for key in TARGETS:
        root_marker = f"$course$/top/{key}"
        if root_marker not in present_categories:
            errors.append(
                f"{key}: root category marker '{root_marker}' not found in "
                "export (renamed or deleted)"
            )

        entries = buckets[key]
        n_cat = sum(1 for e in entries if e.get("type") == "category")
        n_q = len(entries) - n_cat
        if n_cat < 1:
            errors.append(f"{key}: no category markers found (need >= 1)")
        if n_q < 1:
            errors.append(f"{key}: no questions found (need >= 1)")
    return errors


def write_atomic(tree: ET.ElementTree, path: Path) -> None:
    """Write an ElementTree to path via temp file + os.replace (atomic)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
    )
    os.close(fd)
    tmp_path = Path(tmp_name)
    try:
        tree.write(tmp_path, encoding="UTF-8", xml_declaration=True)
        os.replace(tmp_path, path)
    except BaseException:
        tmp_path.unlink(missing_ok=True)
        raise


def main(argv: list[str] | None = None) -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    args = parse_args(argv)

    try:
        root = ET.parse(args.src).getroot()
    except (OSError, ET.ParseError) as exc:
        print(f"ERROR: could not read/parse {args.src}: {exc}", file=sys.stderr)
        return 1

    buckets = split(root)
    present_categories = category_texts(root)

    errors = validate(buckets, present_categories)
    if errors:
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        print("Aborting: nothing written.", file=sys.stderr)
        return 1

    for key, rel_path in TARGETS.items():
        path = args.out_dir / rel_path
        quiz = ET.Element("quiz")
        quiz.extend(buckets[key])
        ET.indent(quiz)
        write_atomic(ET.ElementTree(quiz), path)
        n_cat = sum(1 for e in buckets[key] if e.get("type") == "category")
        n_q = len(buckets[key]) - n_cat
        print(f"{key}: {n_q} questions, {n_cat} categories -> {path.as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
