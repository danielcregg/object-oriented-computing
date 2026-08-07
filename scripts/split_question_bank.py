#!/usr/bin/env python3
"""Split the full Moodle question-bank export into per-MCQ-week files.

Moodle XML sets the active category with <question type="category"> markers;
every following question belongs to that category until the next marker.
Each output file keeps its subtree's markers, so it re-imports cleanly.

Before writing, every bucket is validated against the full export itself
(no hardcoded expected counts): each of the three MCQ buckets must have at
least one category marker and at least one question, and the three bucket
question-counts plus the shared-bank remainder (Sample/Mike's CodeRunner
categories -- anything outside MCQ1/MCQ2/MCQ3) must add up to the full
export's non-category question count. If validation fails, the script
aborts and writes nothing. Each output file that does get written goes
through a temp file + os.replace so a file is never left half-written.

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


def split(root: ET.Element) -> tuple[dict[str, list[ET.Element]], list[ET.Element]]:
    """Bucket every <question> under its MCQ target, or into 'other' (shared banks)."""
    buckets: dict[str, list[ET.Element]] = {key: [] for key in TARGETS}
    other: list[ET.Element] = []
    current: str | None = None
    for q in root.findall("question"):
        if q.get("type") == "category":
            current = bucket_for(q.find("category/text").text or "")
        (buckets[current] if current else other).append(q)
    return buckets, other


def validate(
    buckets: dict[str, list[ET.Element]], other: list[ET.Element], total_questions: int
) -> list[str]:
    """Return human-readable errors; an empty list means it's safe to write."""
    errors = []
    bucket_question_total = 0
    for key in TARGETS:
        entries = buckets[key]
        n_cat = sum(1 for e in entries if e.get("type") == "category")
        n_q = len(entries) - n_cat
        bucket_question_total += n_q
        if n_cat < 1:
            errors.append(f"{key}: no category markers found (need >= 1)")
        if n_q < 1:
            errors.append(f"{key}: no questions found (need >= 1)")

    other_n_cat = sum(1 for e in other if e.get("type") == "category")
    shared_remainder = len(other) - other_n_cat
    if bucket_question_total + shared_remainder != total_questions:
        errors.append(
            "question-count mismatch: MCQ buckets "
            f"({bucket_question_total}) + shared-bank remainder "
            f"({shared_remainder}) != full-export total ({total_questions})"
        )
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

    total_questions = sum(
        1 for q in root.findall("question") if q.get("type") != "category"
    )
    buckets, other = split(root)

    errors = validate(buckets, other, total_questions)
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
