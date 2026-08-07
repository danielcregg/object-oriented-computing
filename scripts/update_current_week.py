#!/usr/bin/env python3
"""Update README's current-teaching-week banner.

Reads the semester layout from module/schedule-table/module-schedule.json
(startDate + ordered weeks array, where week "X" is reading week) and
rewrites the README banner between the markers:

    <!-- current-week:start --> ... <!-- current-week:end -->

Week 1 is the calendar week containing startDate (weeks run Mon-Sun,
Europe/Dublin). Rows advance one calendar week each, including the
unnumbered reading-week row.

Usage:
    python scripts/update_current_week.py [--date YYYY-MM-DD]

--date overrides "today" for testing. Exit 0 always; the caller decides
whether the README changed (git diff).
"""
import argparse
import datetime
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo

SCHEDULE = Path("module/schedule-table/module-schedule.json")
README = Path("README.md")
MARKER_RE = re.compile(
    r"<!-- current-week:start -->.*?<!-- current-week:end -->", re.DOTALL)


def monday_of(day: datetime.date) -> datetime.date:
    return day - datetime.timedelta(days=day.weekday())


def banner_text(today: datetime.date) -> str:
    data = json.loads(SCHEDULE.read_text(encoding="utf-8"))
    start = datetime.date.fromisoformat(data["startDate"])
    week_rows = data["weeks"]
    first_monday = monday_of(start)
    index = (monday_of(today) - first_monday).days // 7

    if index < 0:
        opens = f"{start:%d %b %Y}"
        return (f"> 🗓️ **Semester has not started yet** — teaching begins the "
                f"week of {opens}.")
    if index >= len(week_rows):
        return "> 🗓️ **Semester finished** — no teaching this week."

    row = week_rows[index]
    week_no = row.get("week", "")
    topic = (row.get("topic") or "").strip()
    wc = first_monday + datetime.timedelta(weeks=index)
    if str(week_no).upper() == "X":
        return (f"> 🗓️ **Reading week** (no lectures or labs) — week beginning "
                f"{wc:%d %b %Y}.")
    label = f" — {topic}" if topic and not topic.startswith("Topic ") else ""
    return (f"> 🗓️ **Current teaching week: {week_no}{label}** "
            f"(week beginning {wc:%d %b %Y}).")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = (datetime.date.fromisoformat(args.date) if args.date
             else datetime.datetime.now(ZoneInfo("Europe/Dublin")).date())

    banner = ("<!-- current-week:start -->\n"
              f"{banner_text(today)}\n"
              "<!-- current-week:end -->")
    text = README.read_text(encoding="utf-8")
    if not MARKER_RE.search(text):
        raise SystemExit("README is missing the current-week markers")
    README.write_text(MARKER_RE.sub(banner, text), encoding="utf-8")
    line = banner.splitlines()[1]
    print(line.encode("ascii", errors="ignore").decode().strip())


if __name__ == "__main__":
    main()
