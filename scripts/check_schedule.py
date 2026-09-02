#!/usr/bin/env python3
"""CI gate: module/schedule.json is the module's only schedule, and every view agrees.

Fails (exit 1, every finding listed) when:
  - the schedule itself is malformed: startDate not a Monday, week numbers not
    1..N in order, not exactly one reading-week row;
  - a row names a deck, lab or non-teaching page that does not exist;
  - a folder under weeks/ is not claimed by any row (it would vanish from the
    site with CI green), or still carries a week number in its name;
  - a deck declares `week:` in its frontmatter or a week number in its kicker,
    or an MCQ page titles itself with a week -- the schedule is stated ONCE;
  - README's generated schedule table is stale (run update_current_week.py);
  - module/module-overview.md lacks a section per row, or has them out of order.

Usage:
    python scripts/check_schedule.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import LABS, WEEKS, load  # noqa: E402
import update_current_week  # noqa: E402

OVERVIEW = Path("module/module-overview.md")
README = Path("README.md")


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

    claimed: set[str] = set()
    for r in sched.rows:
        f = r.folder
        if f is None:
            findings.append(f"week {r.week}: has no lecture, is not an MCQ and is not the reading week")
            continue
        claimed.add(f)
        if r.deck and not (WEEKS / f / "slides.md").is_file():
            findings.append(f"week {r.week}: weeks/{f}/slides.md does not exist")
        if not r.deck and not (WEEKS / f / "README.md").is_file():
            findings.append(f"week {r.week}: weeks/{f}/README.md does not exist")
        if r.lab and not (LABS / r.lab).is_dir():
            findings.append(f"week {r.week}: labs/src/ie/atu/{r.lab}/ does not exist")
        if r.deck and not r.topic:
            findings.append(f"week {r.week}: a lecture row needs a topic")

    for d in sorted(p.name for p in WEEKS.iterdir() if p.is_dir()):
        if d not in claimed:
            findings.append(f"weeks/{d}/ is not in module/schedule.json, so it would not be on the site")
        if re.match(r"week-\d", d):
            findings.append(f"weeks/{d}/: folder names carry no week number; the schedule does")

    for deck in sorted(WEEKS.glob("*/slides.md")):
        text = deck.read_text(encoding="utf-8")
        if re.search(r"(?m)^week:", text):
            findings.append(f"{deck}: frontmatter must not declare week: (the schedule does)")
        if re.search(r'class="kicker">// week \d', text):
            findings.append(f"{deck}: the title kicker must not state a week number")
    for r in sched.rows:
        if r.mcq and (WEEKS / r.folder / "README.md").is_file():
            first = (WEEKS / r.folder / "README.md").read_text(encoding="utf-8").splitlines()[0]
            if re.search(r"[Ww]eek \d", first):
                findings.append(f"weeks/{r.folder}/README.md: the title must not state a week number")

    readme = README.read_text(encoding="utf-8")
    m = re.search(r"<!-- schedule-table:start -->\n(.*?)<!-- schedule-table:end -->", readme, re.S)
    if not m:
        findings.append("README.md: schedule-table markers are missing")
    else:
        committed = re.sub(r"\*\*➡️ (.*?)\*\*", r"\1", m.group(1)).strip()
        if committed != update_current_week.render_table(sched, None).strip():
            findings.append("README.md: the schedule table is stale; run scripts/update_current_week.py")

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
