#!/usr/bin/env python3
"""Rewrite README's current-week banner and its schedule table from module/schedule.json.

Both are generated, so neither can drift from the schedule:

    <!-- current-week:start --> ... <!-- current-week:end -->    the banner
    <!-- schedule-table:start --> ... <!-- schedule-table:end -->  the table

The table gets a **➡️** marker on the current row (none outside term). Weeks
run Mon-Sun, Europe/Dublin. A GitHub Action runs this every Monday; the CI gate
scripts/check_schedule.py fails if the committed table is stale, so run it after
any change to module/schedule.json.

Usage:
    python scripts/update_current_week.py [--date YYYY-MM-DD]

--date overrides "today" for testing. Exit 0 always; the caller decides
whether the README changed (git diff).
"""
from __future__ import annotations

import argparse
import datetime
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import Row, Schedule, load  # noqa: E402

README = Path("README.md")
BANNER_RE = re.compile(r"<!-- current-week:start -->.*?<!-- current-week:end -->", re.DOTALL)
TABLE_RE = re.compile(r"<!-- schedule-table:start -->.*?<!-- schedule-table:end -->", re.DOTALL)


def banner(sched: Schedule, today: datetime.date) -> tuple[str, Row | None]:
    """Return (banner line, the current row or None)."""
    row = sched.row_for(today)
    if row is None:
        if today < sched.start:
            return (f"> 🗓️ **Semester has not started yet** — teaching begins the "
                    f"week of {sched.start:%d %b %Y}."), None
        return "> 🗓️ **Semester finished** — no more lectures or labs this semester.", None
    monday = sched.monday(row)
    if row.is_break:
        return (f"> 🗓️ **Reading week** (no lectures or labs) — week beginning "
                f"{monday:%d %b %Y}."), row
    if row.mcq:
        when = row.notes.lower() if row.notes else "held during the lab slot"
        return (f"> 🗓️ **This week: {row.assessment}** — {when} (week beginning "
                f"{monday:%d %b %Y}). Read the [MCQ brief](mcq/README.md) first."), row
    return (f"> 🗓️ **Current teaching week: {row.week} — {row.topic}** "
            f"(week beginning {monday:%d %b %Y})."), row


def table_row(row: Row, current: Row | None) -> str:
    week = "—" if row.is_break else row.week
    if current is not None and row.index == current.index:
        week = f"**➡️ {week}**"
    if row.deck:
        lecture = f"[slides](weeks/{row.deck}/slides.md)"
        if row.lab:
            lab = f"[lab](labs/src/ie/atu/{row.lab}/)"
        else:
            lab = f"_{row.notes}_" if row.notes else "—"
        return f"| {week} | {row.topic} | {lecture} | {lab} |"
    if row.mcq:
        note = f" · {row.notes.lower()}" if row.notes else ""
        return (f"| {week} | **{row.assessment}**{note} | "
                f"[details](weeks/{row.folder}/README.md) · [brief](mcq/README.md) | — |")
    return f"| {week} | {row.notes or 'Reading week'} | [details](weeks/{row.folder}/README.md) | — |"


def render_table(sched: Schedule, current: Row | None) -> str:
    lines = ["| Week | Topic | Lecture | Lab |", "|---|---|---|---|"]
    lines += [table_row(r, current) for r in sched.rows]
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    if args.date:
        today = datetime.date.fromisoformat(args.date)
    else:
        from zoneinfo import ZoneInfo
        today = datetime.datetime.now(ZoneInfo("Europe/Dublin")).date()

    sched = load()
    line, current = banner(sched, today)
    text = README.read_text(encoding="utf-8")
    for name, rx in (("current-week", BANNER_RE), ("schedule-table", TABLE_RE)):
        if not rx.search(text):
            raise SystemExit(f"README is missing the {name} markers")
    text = BANNER_RE.sub(f"<!-- current-week:start -->\n{line}\n<!-- current-week:end -->", text)
    text = TABLE_RE.sub("<!-- schedule-table:start -->\n" + render_table(sched, current)
                        + "<!-- schedule-table:end -->", text)
    README.write_text(text, encoding="utf-8")
    print(line.encode("ascii", errors="ignore").decode().strip())


if __name__ == "__main__":
    main()
