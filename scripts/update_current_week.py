#!/usr/bin/env python3
"""Update README's current-teaching-week banner.

The semester calendar is DERIVED, not configured — no schedule file needed:

  - Reading week is always the week of the Irish October bank holiday
    (the last Monday of October).
  - There are exactly 6 teaching weeks before it (weeks 1-6) and 6 after
    (weeks 7-12), so week 1 begins 6 weeks before bank-holiday Monday.
  - Week topics come from the weeks/ folder names and each deck's
    frontmatter title, so renaming/renumbering a week updates the banner
    automatically.

Rewrites the README between the markers:

    <!-- current-week:start --> ... <!-- current-week:end -->

and moves a **➡️ N** highlight onto the current row of the schedule
table (the — row during reading week; no row outside the semester).
Weeks run Mon-Sun, Europe/Dublin.

Usage:
    python scripts/update_current_week.py [--date YYYY-MM-DD]

--date overrides "today" for testing. Exit 0 always; the caller decides
whether the README changed (git diff).

The Pages landing page mirrors this calendar client-side (inline JS in
scripts/build_index.py) — change the formula in BOTH places or the README
and the site will disagree.
"""
import argparse
import datetime
import re
from pathlib import Path
from zoneinfo import ZoneInfo

README = Path("README.md")
WEEKS = Path("weeks")
MARKER_RE = re.compile(
    r"<!-- current-week:start -->.*?<!-- current-week:end -->", re.DOTALL)
TITLE_RE = re.compile(r'^title:\s*"?([^"\n]+?)"?\s*$', re.MULTILINE)

TEACHING_WEEKS = 12
BEFORE_BREAK = 6  # teaching weeks before reading week (and after it)


def monday_of(day: datetime.date) -> datetime.date:
    return day - datetime.timedelta(days=day.weekday())


def bank_holiday_monday(year: int) -> datetime.date:
    """The Irish October bank holiday: the last Monday of October."""
    return monday_of(datetime.date(year, 10, 31))


def week1_monday(year: int) -> datetime.date:
    return bank_holiday_monday(year) - datetime.timedelta(weeks=BEFORE_BREAK)


def topics_from_tree() -> dict[int, str]:
    """Map week number -> topic label, derived from weeks/ folders."""
    topics: dict[int, str] = {}
    if not WEEKS.is_dir():
        return topics
    for folder in sorted(p for p in WEEKS.iterdir() if p.is_dir()):
        m = re.match(r"week-(\d+)-(.+)$", folder.name)
        if not m:
            continue  # week-06b-reading-week etc. — position is computed, not read
        number, slug = int(m.group(1)), m.group(2)
        mcq = re.fullmatch(r"mcq(\d)", slug)
        if mcq:
            topics[number] = f"MCQ {mcq.group(1)}"
            continue
        deck = folder / "lecture" / "slides.md"
        if deck.is_file():
            t = TITLE_RE.search(deck.read_text(encoding="utf-8"))
            if t:
                topics[number] = t.group(1)
                continue
        topics[number] = slug.replace("-", " ").title()
    return topics


def banner_and_highlight(today: datetime.date) -> tuple[str, str | None]:
    """Return (banner line, schedule-table row key to highlight or None).

    The row key is the Week-column cell text: "1".."12", or the em-dash
    "—" for the reading-week row.
    """
    reading = bank_holiday_monday(today.year)
    start = week1_monday(today.year)
    this_monday = monday_of(today)
    index = (this_monday - start).days // 7  # 0-12; reading week is index 6

    if index < 0:
        return (f"> 🗓️ **Semester has not started yet** — teaching begins the "
                f"week of {start:%d %b %Y}."), None
    if index > TEACHING_WEEKS:  # rows 0..12 cover the semester
        nxt = week1_monday(today.year + 1)
        return (f"> 🗓️ **Semester finished** — teaching returns the week of "
                f"{nxt:%d %b %Y}."), None
    if this_monday == reading:
        return (f"> 🗓️ **Reading week** (no lectures or labs) — week beginning "
                f"{reading:%d %b %Y}."), "—"

    week_no = index + 1 if this_monday < reading else index
    topic = topics_from_tree().get(week_no, "")
    label = f" — {topic}" if topic else ""
    return (f"> 🗓️ **Current teaching week: {week_no}{label}** "
            f"(week beginning {this_monday:%d %b %Y})."), str(week_no)


TABLE_ROW_RE = re.compile(r"^\|\s*([^|]*?)\s*\|(.*)$")
HIGHLIGHT_RE = re.compile(r"^\*\*➡️\s*(.*?)\*\*$")


def apply_table_highlight(text: str, key: str | None) -> str:
    """Move the **➡️** marker to the schedule row whose Week cell == key.

    Every run first strips any existing marker (idempotent), so the
    highlight follows the semester week by week and disappears outside
    term. Non-schedule tables are safe: only a cell exactly equal to the
    key is ever marked.
    """
    out = []
    for line in text.split("\n"):
        m = TABLE_ROW_RE.match(line) if line.startswith("|") else None
        if m:
            original = m.group(1)
            cell = original
            prev = HIGHLIGHT_RE.match(cell)
            if prev:
                cell = prev.group(1).strip()
            if key is not None and cell == key:
                cell = f"**➡️ {cell}**"
            if cell != original:
                line = f"| {cell} |{m.group(2)}"
        out.append(line)
    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = (datetime.date.fromisoformat(args.date) if args.date
             else datetime.datetime.now(ZoneInfo("Europe/Dublin")).date())

    banner_line, highlight_key = banner_and_highlight(today)
    banner = ("<!-- current-week:start -->\n"
              f"{banner_line}\n"
              "<!-- current-week:end -->")
    text = README.read_text(encoding="utf-8")
    if not MARKER_RE.search(text):
        raise SystemExit("README is missing the current-week markers")
    text = MARKER_RE.sub(banner, text)
    text = apply_table_highlight(text, highlight_key)
    README.write_text(text, encoding="utf-8")
    line = banner.splitlines()[1]
    print(line.encode("ascii", errors="ignore").decode().strip())


if __name__ == "__main__":
    main()
