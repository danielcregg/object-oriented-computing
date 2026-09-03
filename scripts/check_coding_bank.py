#!/usr/bin/env python3
"""Validate the coding-question bank (practice/bank/coding.json), and optionally
run reference solutions through the exact wrapper the practice page uses.

Schema (one object per question):
    id          "coding-<topic>-NNN", unique
    topic       a slug from practice/bank/manifest.json
    difficulty  easy | medium | hard
    kind        method  - the student writes static method(s); tests are Java
                          statements run inside Main.main, one after another
                class   - the student writes a (non-public) class; tests are
                          statements that use it from Main.main
                program - the student writes the whole Main.java; each test
                          feeds `stdin` and compares stdout
    title, question, starter
    tests       [{"code": ..., "expected": ...}]  (method/class)
                [{"stdin": ..., "expected": ...}] (program), at least 2
    show        how many tests the page shows before the first check (default: all)

Expected outputs are compared after trimming trailing whitespace on every line
and trailing blank lines, exactly as the page does.

    python scripts/check_coding_bank.py                      # CI: schema only
    python scripts/check_coding_bank.py --solutions DIR      # also compile+run DIR/<id>.java

Reference solutions live OUTSIDE this public repo (the private labs-solutions
repo); the --solutions run is how an author proves the expected outputs before
committing them. Needs javac/java on PATH.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

BANK = Path("practice/bank")
CODING = BANK / "coding.json"
KINDS = {"method", "class", "program"}
DIFFICULTIES = {"easy", "medium", "hard"}
SEP = "#|#TEST#|#"
SCHEDULE_RE = re.compile(r"\bweek\s*\d|\blecture\b|\bthis module\b|\bMCQ\s*[123]\b", re.I)


def wrap(q: dict, code: str, tests: list[dict]) -> str:
    """Mirror of wrap() in practice/coding/index.html -- keep them identical."""
    if q["kind"] == "program":
        return code
    body = "\n".join(
        "        " + t["code"].replace("\n", "\n        ") + f'\n        System.out.println("{SEP}");'
        for t in tests)
    main = "    public static void main(String[] args) {\n" + body + "\n    }\n"
    if q["kind"] == "method":
        return "public class Main {\n" + code + "\n" + main + "}\n"
    return code + "\n\npublic class Main {\n" + main + "}\n"


def norm(s: str) -> str:
    return "\n".join(line.rstrip() for line in s.replace("\r", "").split("\n")).rstrip("\n")


def check_schema(qs: list[dict], slugs: set[str]) -> list[str]:
    findings, seen = [], set()
    for q in qs:
        qid = q.get("id", "<no id>")
        if qid in seen:
            findings.append(f"{qid}: duplicate id")
        seen.add(qid)
        if q.get("topic") not in slugs:
            findings.append(f"{qid}: topic {q.get('topic')!r} is not in the manifest")
        if q.get("difficulty") not in DIFFICULTIES:
            findings.append(f"{qid}: bad difficulty {q.get('difficulty')!r}")
        if q.get("kind") not in KINDS:
            findings.append(f"{qid}: bad kind {q.get('kind')!r}")
            continue
        for field in ("title", "question", "starter"):
            if not q.get(field):
                findings.append(f"{qid}: missing {field}")
        tests = q.get("tests")
        if not isinstance(tests, list) or len(tests) < 2:
            findings.append(f"{qid}: needs at least 2 tests")
            continue
        key = "stdin" if q["kind"] == "program" else "code"
        for i, t in enumerate(tests):
            if key not in t or "expected" not in t:
                findings.append(f"{qid}: test {i + 1} needs {key!r} and 'expected'")
            elif q["kind"] != "program" and not t["code"].strip():
                findings.append(f"{qid}: test {i + 1} has empty code")
            elif not str(t["expected"]).strip():
                findings.append(f"{qid}: test {i + 1} has an empty expected output")
            if q["kind"] != "program" and SEP in t.get("code", ""):
                findings.append(f"{qid}: test {i + 1} contains the separator string")
        if q["kind"] == "program" and "public class Main" not in q["starter"]:
            findings.append(f"{qid}: a program question's starter must declare `public class Main`")
        if q["kind"] == "class" and re.search(r"\bpublic\s+class\b", q["starter"]):
            findings.append(f"{qid}: a class question's starter must not be a public class (Main is)")
        if "show" in q and not (isinstance(q["show"], int) and 1 <= q["show"] <= len(tests)):
            findings.append(f"{qid}: show must be between 1 and the number of tests")
        blob = " ".join([q.get("title", ""), q.get("question", "")])
        if SCHEDULE_RE.search(blob):
            findings.append(f"{qid}: schedule/module reference (questions must be self-contained)")
    return findings


def run_solutions(qs: list[dict], sol_dir: Path) -> tuple[list[str], int, int]:
    findings, checked, todo = [], 0, 0
    with tempfile.TemporaryDirectory() as tmp:
        for q in qs:
            src = sol_dir / f"{q['id']}.java"
            if not src.is_file():
                todo += 1
                continue
            code = src.read_text(encoding="utf-8")
            work = Path(tmp) / q["id"]
            work.mkdir()
            if q["kind"] == "program":
                runs = [(wrap(q, code, []), t.get("stdin", ""), [t]) for t in q["tests"]]
            else:
                runs = [(wrap(q, code, q["tests"]), "", q["tests"])]
            for source, stdin, tests in runs:
                (work / "Main.java").write_text(source, encoding="utf-8")
                build = subprocess.run(["javac", "-d", str(work), str(work / "Main.java")],
                                       capture_output=True, text=True)
                if build.returncode != 0:
                    findings.append(f"{q['id']}: solution does not compile: {build.stderr.strip()[:300]}")
                    break
                try:
                    run = subprocess.run(["java", "-cp", str(work), "Main"], input=stdin,
                                         capture_output=True, text=True, timeout=20)
                except subprocess.TimeoutExpired:
                    findings.append(f"{q['id']}: solution timed out")
                    break
                if run.returncode != 0:
                    findings.append(f"{q['id']}: solution crashed: {run.stderr.strip().splitlines()[0][:200] if run.stderr.strip() else ''}")
                    break
                pieces = ([run.stdout] if q["kind"] == "program"
                          else run.stdout.split(SEP + "\n")[:len(tests)])
                for i, (t, got) in enumerate(zip(tests, pieces)):
                    if norm(got) != norm(str(t["expected"])):
                        findings.append(f"{q['id']}: test {i + 1} expected {norm(str(t['expected']))!r}, "
                                        f"solution printed {norm(got)!r}")
                if len(pieces) < len(tests):
                    findings.append(f"{q['id']}: solution produced output for only {len(pieces)} of {len(tests)} tests")
            checked += 1
    return findings, checked, todo


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--solutions", type=Path, help="directory of <id>.java reference solutions")
    args = ap.parse_args()
    if not CODING.is_file():
        raise SystemExit(f"check_coding_bank: {CODING} is missing")
    data = json.loads(CODING.read_text(encoding="utf-8"))
    qs = data.get("questions")
    if not isinstance(qs, list) or not qs:
        raise SystemExit(f"check_coding_bank: {CODING} has no questions")
    manifest = json.loads((BANK / "manifest.json").read_text(encoding="utf-8"))
    slugs = {t["slug"] for t in manifest["topics"]}
    findings = check_schema(qs, slugs)
    summary = f"{len(qs)} coding questions across {len({q.get('topic') for q in qs})} topics"
    if args.solutions and not findings:
        more, checked, todo = run_solutions(qs, args.solutions)
        findings += more
        summary += f"; {checked} verified against reference solutions, {todo} with no solution yet"
    if findings:
        print("\n".join("check_coding_bank: " + f for f in findings))
        sys.exit(1)
    print("check_coding_bank: " + summary)


if __name__ == "__main__":
    main()
