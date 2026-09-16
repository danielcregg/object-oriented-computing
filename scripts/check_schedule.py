#!/usr/bin/env python3
"""CI gate: module/schedule.json is the module's only schedule, and every view agrees.

Fails (exit 1, every finding listed) when:
  - the schedule itself is malformed: startDate not a Monday, week numbers not
    1..N in order, not exactly one reading-week row;
  - a row's folder under lectures-and-labs/ (named from its week number) lacks
    what the row promises, or holds another shape: a teaching week has exactly
    one lecture, <topic>-lecture.md for that topic (its frontmatter `topic` is
    the row's lectureUrl folder); a lab week has <topic>_lab/ holding README.md
    titled for the topic plus Main.java, and nothing of the lab at week level;
    an MCQ week or the reading week has README.md and no lab folder;
  - a tracked Java file is not in its week's lab folder, or does not declare
    that folder path as its package;
  - a tracked folder under lectures-and-labs/ belongs to no schedule row, or
    anything is tracked under the retired weeks/ or labs/ layout;
  - a lecture declares `week:` in its frontmatter or a week number in its
    kicker, or an MCQ page titles itself with a week (the folder name is the
    only place a week number belongs);
  - README.md or lectures-and-labs/README.md holds a stale week table (run
    scripts/update_current_week.py);
  - module/module-overview.md lacks a section per row, or has them out of order.

Usage:
    python scripts/check_schedule.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import ROOT, load  # noqa: E402
import update_current_week as ucw  # noqa: E402

OVERVIEW = Path("module/module-overview.md")
MARKER_RE = re.compile(r"\*\*➡️ (.*?)\*\*")


def tracked(*paths: str) -> list[str]:
    out = subprocess.run(["git", "ls-files", "--", *paths], capture_output=True, text=True)
    return out.stdout.split() if out.returncode == 0 else []


def frontmatter_topic(text: str) -> str | None:
    fm = re.match(r"---\r?\n(.*?)\r?\n---", text, re.S)
    topic = re.search(r"(?m)^topic:\s*(\S+)", fm.group(1)) if fm else None
    return topic.group(1).strip("\"'") if topic else None


def first_line(path: Path) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    return lines[0] if lines else ""


def table_findings(path: Path, want: str) -> list[str]:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<!-- schedule-table:start -->\n(.*?)<!-- schedule-table:end -->", text, re.S)
    if not m:
        return [f"{path}: schedule-table markers are missing"]
    if MARKER_RE.sub(r"\1", m.group(1)).strip() != want.strip():
        return [f"{path}: the week table is stale; run scripts/update_current_week.py"]
    return []


def main() -> None:
    findings: list[str] = []
    sched = load()

    if sched.start.weekday() != 0:
        findings.append(f"startDate {sched.start} is a {sched.start:%A}, not a Monday")
    numbered = [r.week for r in sched.rows if not r.is_break]
    if numbered != [str(n) for n in range(1, len(numbered) + 1)]:
        findings.append(f"week numbers must run 1..N in order; got {numbered}")
    if sum(r.is_break for r in sched.rows) != 1:
        findings.append("expected exactly one reading-week row (week \"X\")")

    for r in sched.rows:
        d = r.path
        if not (r.deck or r.mcq or r.is_break):
            findings.append(f"week {r.week}: has no lecture, is not an MCQ and is not the reading week")
        if not d.is_dir():
            findings.append(f"week {r.week}: {d.as_posix()}/ does not exist")
            continue

        lectures = sorted(p.name for p in d.iterdir() if p.is_file() and p.name.endswith("lecture.md"))
        if r.deck:
            if not r.topic:
                findings.append(f"week {r.week}: a lecture row needs a topic")
            if not r.lecture.is_file():
                findings.append(f"week {r.week}: {r.lecture.as_posix()} does not exist")
            else:
                topic = frontmatter_topic(r.lecture.read_text(encoding="utf-8"))
                if topic != r.deck:
                    findings.append(f"week {r.week}: {r.lecture.as_posix()} is the {topic!r} lecture, "
                                    f"but the schedule puts {r.deck!r} in this week")
            extra = [n for n in lectures if n != r.lecture.name]
            if extra:
                findings.append(f"week {r.week}: {d.as_posix()}/ also holds {extra}; the lecture is {r.lecture.name}")
        elif lectures:
            findings.append(f"week {r.week}: {d.as_posix()}/ holds {lectures}, but the schedule has no lecture this week")

        folders = sorted(p.name for p in d.iterdir() if p.is_dir() and p.name != "img")
        if r.lab:
            if not r.deck:
                findings.append(f"week {r.week}: a lab row needs a lecture (the lab folder is named from its topic)")
            else:
                ld = r.lab_dir
                if not ld.is_dir():
                    findings.append(f"week {r.week}: {ld.as_posix()}/ (the lab folder) does not exist")
                else:
                    readme = ld / "README.md"
                    if not readme.is_file():
                        findings.append(f"week {r.week}: {readme.as_posix()} (the lab instructions) does not exist")
                    elif r.topic.lower() not in first_line(readme).lower():
                        findings.append(f"week {r.week}: {readme.as_posix()} is titled "
                                        f"{first_line(readme)!r}, not as the {r.topic} lab")
                    if not (ld / "Main.java").is_file():
                        findings.append(f"week {r.week}: {ld.as_posix()}/Main.java (the lab's starter) does not exist")
                extra = [n for n in folders if n != r.lab_folder]
                if extra:
                    findings.append(f"week {r.week}: {d.as_posix()}/ holds folders {extra}; the lab folder is {r.lab_folder}/")
            for stray in ("README.md", "Main.java"):
                if (d / stray).exists():
                    findings.append(f"week {r.week}: {d.as_posix()}/{stray} exists, but a lab week keeps "
                                    f"its {stray} inside {r.lab_folder or '<topic>_lab'}/")
        else:
            if folders:
                findings.append(f"week {r.week}: {d.as_posix()}/ holds folders {folders}, but the schedule has no lab this week")
            if (d / "Main.java").exists():
                findings.append(f"week {r.week}: {d.as_posix()}/Main.java exists, but the schedule has no lab this week")
            if r.mcq or r.is_break:
                readme = d / "README.md"
                if not readme.is_file():
                    findings.append(f"week {r.week}: {readme.as_posix()} does not exist")
                elif r.mcq and re.search(r"[Ww]eek \d", first_line(readme)):
                    findings.append(f"{readme.as_posix()}: the title must not state a week number")

    rows_by_dir = {r.dir: r for r in sched.rows}
    for f in tracked(ROOT.as_posix()):
        parts = Path(f).parts
        if len(parts) > 2 and parts[1] not in rows_by_dir:
            findings.append(f"{f}: {ROOT.as_posix()}/{parts[1]}/ is not the folder of any schedule "
                            f"row (week folders are named from the schedule's week numbers)")
            continue
        if f.endswith(".java"):
            row = rows_by_dir.get(parts[1]) if len(parts) > 2 else None
            if row is None or not row.lab_folder or len(parts) != 4 or parts[2] != row.lab_folder:
                where = f"{row.dir}/{row.lab_folder}/" if row and row.lab_folder else "a week with a lab"
                findings.append(f"{f}: Java files live in their week's lab folder ({where})")
                continue
            src = Path(f).read_text(encoding="utf-8")
            pkg = re.search(r"(?m)^\s*package\s+([\w.]+)\s*;", src)
            if not pkg or pkg.group(1) != row.package:
                findings.append(f"{f}: must declare `package {row.package};` "
                                f"(declares {pkg.group(1) if pkg else 'no package'})")
    for f in tracked("weeks", "labs"):
        findings.append(f"{f}: the weeks/ and labs/ layout is retired; everything lives under {ROOT.as_posix()}/")

    for lecture in sorted(ROOT.glob("*/*-lecture.md")):
        text = lecture.read_text(encoding="utf-8")
        if re.search(r"(?m)^week:", text):
            findings.append(f"{lecture.as_posix()}: frontmatter must not declare week: (the folder name does)")
        if re.search(r'class="kicker">// week \d', text):
            findings.append(f"{lecture.as_posix()}: the title kicker must not state a week number")

    findings += table_findings(ucw.README, ucw.render_table(sched, None, ucw.FROM_ROOT))
    findings += table_findings(ucw.INDEX, ucw.render_table(sched, None, ucw.FROM_INDEX))

    heads = [l[3:].strip() for l in OVERVIEW.read_text(encoding="utf-8").splitlines() if l.startswith("## ")]
    last = -1
    for r in sched.rows:
        want = r.topic or r.assessment or "Reading week"
        idx = next((i for i, h in enumerate(heads) if h == want or h.startswith(want + " ")), None)
        if idx is None:
            findings.append(f"{OVERVIEW}: no '## {want}' section")
        elif idx < last:
            findings.append(f"{OVERVIEW}: '## {want}' is out of schedule order")
        else:
            last = idx

    if findings:
        print("\n".join("check_schedule: " + f for f in findings))
        sys.exit(1)
    print(f"check_schedule: {len(sched.rows)} rows from {sched.start}; every view agrees")


if __name__ == "__main__":
    main()
