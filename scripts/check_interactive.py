#!/usr/bin/env python3
"""Check the interactive layer's data (interactive/<lab>/) against the lab READMEs.

For every lab with an interactive/<labUrl folder>/lab.json:
  - lab.json holds only the keys the site build reads, and every id is a plain slug;
  - every placement names a heading the README really has, and every DIY with a task
    animation has an **Expected output**;
  - the journey names every DIY the README has, and nothing else;
  - every animation and puzzle file is used, and every one used exists;
  - a task animation (task-diy-K) shows no code: no code panel, and no code-like
    captions;
  - its console ends on exactly DIY K's expected output;
  - a section animation that follows a README example (by class name) ends on exactly
    the README's Output block for it, where the README shows one;
  - puzzles are one per section, with an id matching their file.
Outputs are compared the way the solutions repo's checker compares them: whole text
trimmed, trailing spaces stripped from each line.

Prints nothing and exits 0 when everything holds; otherwise prints each problem and
exits 1. Stdlib only.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import load  # noqa: E402

ROOT = Path("interactive")
KEYS = {"animations", "taskAnimations", "puzzles", "journey"}
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DIY_RE = re.compile(r"^\s*### DIY (\d+):\s*(.+?)\s*$")
# A caption must not read like code: a statement's end, a call, indexing or an assignment.
# Prose may still use brackets with a space before them ("its length (13)") and semicolons.
CODE_LIKE = re.compile(r"[)\]\"']\s*;|;\s*$|\b[A-Za-z_]\w*\([^)]*\)|\b[A-Za-z_]\w*\[[^\]]*\]"
                       r"|[^=!<>]=[^=]")


def normalise(text: str) -> str:
    return "\n".join(line.rstrip() for line in text.strip().split("\n")).strip()


def expected_outputs(readme: str) -> dict[int, str]:
    lines = readme.split("\n")
    marks = [(i, int(m.group(1))) for i, line in enumerate(lines) if (m := DIY_RE.match(line))]
    found = {}
    for idx, (i, number) in enumerate(marks):
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(lines)
        for j in range(i, end):
            if "**Expected output**" not in lines[j]:
                continue
            k = j + 1
            while k < end and not lines[k].strip().startswith("```text"):
                k += 1
            body, k = [], k + 1
            while k < end and not lines[k].strip().startswith("```"):
                body.append(lines[k].rstrip())
                k += 1
            found[number] = "\n".join(body)
            break
    return found


def example_output(readme: str, name: str) -> str | None:
    """The README's Output block for the ```java example that declares `class <name>`."""
    m = re.search(r"```java\n(?:(?!```).)*?\bclass\s+" + re.escape(name) + r"\b.*?```", readme, re.S)
    if not m:
        return None
    rest = readme[m.end():]
    out = re.match(r"\s*<details>\s*<summary>Output</summary>\s*```[^\n]*\n(.*?)```", rest, re.S)
    return out.group(1) if out else None


def printed(segment: dict) -> str:
    return "".join(step.get("print", "") for step in segment.get("steps", []))


def check_lab(slug: str, readme_path: Path) -> list[str]:
    folder = ROOT / slug
    problems = []
    readme = readme_path.read_text(encoding="utf-8")
    heads = readme.split("\n")
    lab = json.loads((folder / "lab.json").read_text(encoding="utf-8"))
    expected = expected_outputs(readme)
    where = f"interactive/{slug}"

    for key in sorted(set(lab) - KEYS):
        problems.append(f"{where}/lab.json: unknown key {key!r} (the build reads {sorted(KEYS)})")
    for item in lab.get("animations", []) + lab.get("taskAnimations", []) + lab.get("puzzles", []):
        if not ID_RE.match(str(item.get("id", ""))):
            problems.append(f"{where}/lab.json: id {item.get('id')!r} is not a lowercase slug")
    diys = {int(m.group(1)) for line in heads if (m := DIY_RE.match(line))}
    labels = {int(k) for k in lab.get("journey", {}).get("labels", {})}
    if labels and labels != diys:
        problems.append(f"{where}/lab.json: journey labels name DIYs {sorted(labels)}, "
                        f"the README has {sorted(diys)}")

    used_anims, used_plays = set(), set()
    for item in lab.get("animations", []) + lab.get("puzzles", []):
        if not any(line.startswith(item["before"]) for line in heads):
            problems.append(f"{where}/lab.json: {item['id']}: no README heading starts with {item['before']!r}")
    for item in lab.get("animations", []):
        used_anims.add(item["id"])
    for task in lab.get("taskAnimations", []):
        used_anims.add(task["id"])
        if task["diy"] not in expected:
            problems.append(f"{where}/lab.json: {task['id']}: DIY {task['diy']} has no **Expected output**")
    for item in lab.get("puzzles", []):
        used_plays.add(item["id"])

    for kind, used in (("animations", used_anims), ("puzzles", used_plays)):
        present = {p.stem for p in (folder / kind).glob("*.json")} if (folder / kind).is_dir() else set()
        for missing in sorted(used - present):
            problems.append(f"{where}/{kind}/{missing}.json: named in lab.json but missing")
        for unused in sorted(present - used):
            problems.append(f"{where}/{kind}/{unused}.json: not named in lab.json")

    tasks = {t["id"]: t["diy"] for t in lab.get("taskAnimations", [])}
    for path in sorted((folder / "animations").glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except ValueError as err:
            problems.append(f"{path}: not valid JSON ({err})")
            continue
        if data.get("id") != path.stem:
            problems.append(f"{path}: id {data.get('id')!r} does not match the file name")
        segments = data.get("segments", [])
        main = [s for s in segments if not s.get("extra")]
        if path.stem in tasks:
            k = tasks[path.stem]
            if data.get("task") != k:
                problems.append(f"{path}: \"task\" should be {k}")
            for seg in segments:
                if seg.get("code"):
                    problems.append(f"{path}: a task animation must not show code")
                for step in seg.get("steps", []):
                    if CODE_LIKE.search(step.get("caption", "")):
                        problems.append(f"{path}: caption reads like code: {step['caption'][:80]!r}")
            if len(main) != 1:
                problems.append(f"{path}: needs exactly one main (non-extra) segment")
            elif k in expected and normalise(printed(main[0])) != normalise(expected[k]):
                problems.append(f"{path}: its console does not end on DIY {k}'s expected output")
        else:
            for seg in main:
                name = seg.get("example")
                if not name:
                    continue
                want = example_output(readme, name)
                if want is not None and normalise(printed(seg)) != normalise(want):
                    problems.append(f"{path}: segment for {name} does not print the README's Output")

    sections = []
    for path in sorted((folder / "puzzles").glob("*.json")) if (folder / "puzzles").is_dir() else []:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except ValueError as err:
            problems.append(f"{path}: not valid JSON ({err})")
            continue
        if data.get("id") != path.stem:
            problems.append(f"{path}: id {data.get('id')!r} does not match the file name")
        if not data.get("type") or not data.get("rounds"):
            problems.append(f"{path}: needs a type and rounds")
        sections.append(data.get("section"))
    if len(sections) != len(set(sections)):
        problems.append(f"{where}/puzzles: two puzzles claim the same section")
    return problems


def main() -> None:
    if not ROOT.is_dir():
        return
    labs = {row.lab: row.lab_dir / "README.md" for row in load().labs}
    problems = []
    for overlay in sorted(ROOT.glob("*/lab.json")):
        slug = overlay.parent.name
        if slug not in labs:
            problems.append(f"{overlay}: no lab {slug!r} in the schedule")
            continue
        problems += check_lab(slug, labs[slug])
    for problem in problems:
        print(problem)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
