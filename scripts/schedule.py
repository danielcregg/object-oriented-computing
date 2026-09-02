#!/usr/bin/env python3
"""The module schedule: ONE file, module/schedule.json, that every view derives from.

module/schedule.json is an export from the lecturer's module-schedule-table-builder
app (https://github.com/danielcregg/module-schedule-table-builder). It is edited
there and re-exported here, and it is the same file the Moodle course-page table
is generated from (scripts/build_moodle_schedule.py). The site index, README's
banner and schedule table, the labs index order and the CI gate
(scripts/check_schedule.py) all import this module and read that file. Nothing
else in the repo may state a week number or a semester date.

Rows are consecutive calendar weeks from `startDate` (a Monday), and the "X"
reading-week row is one of them, so row i covers startDate + 7*i days.

    from schedule import load
    sched = load()
    for row in sched.rows: ...
    row = sched.row_for(datetime.date.today())   # None outside the semester
"""
from __future__ import annotations

import datetime
import json
import re
from dataclasses import dataclass
from pathlib import Path

SCHEDULE = Path("module/schedule.json")
SITE = "https://danielcregg.is-a.dev/object-oriented-computing/"
WEEKS = Path("weeks")
LABS = Path("labs/src/ie/atu")
MCQ_RE = re.compile(r"^MCQ (\d)$")
NAME_RE = re.compile(r"^[a-z0-9-]+$")


@dataclass(frozen=True)
class Row:
    index: int          # position in the semester, 0-based, reading week included
    week: str           # "1".."12", or "X" for the reading week
    topic: str          # "Arrays"; empty on MCQ and reading-week rows
    deck: str | None    # weeks/<deck>/slides.md, from lectureUrl
    lab: str | None     # labs/src/ie/atu/<lab>/, from labUrl
    assessment: str     # "MCQ 1", or empty
    notes: str

    @property
    def is_break(self) -> bool:
        return self.week == "X"

    @property
    def mcq(self) -> str | None:
        """'1' for the MCQ 1 row, else None."""
        m = MCQ_RE.match(self.assessment)
        return m.group(1) if m else None

    @property
    def folder(self) -> str | None:
        """The weeks/ folder this row owns: its deck, mcq<n>, or reading-week."""
        if self.deck:
            return self.deck
        if self.mcq:
            return f"mcq{self.mcq}"
        if self.is_break:
            return "reading-week"
        return None

    @property
    def label(self) -> str:
        return self.topic or self.assessment or self.notes


@dataclass(frozen=True)
class Schedule:
    start: datetime.date
    rows: tuple[Row, ...]
    raw: dict

    def monday(self, row: Row) -> datetime.date:
        return self.start + datetime.timedelta(weeks=row.index)

    def sunday(self, row: Row) -> datetime.date:
        return self.monday(row) + datetime.timedelta(days=6)

    @property
    def end(self) -> datetime.date:
        """The first Monday after the last row."""
        return self.start + datetime.timedelta(weeks=len(self.rows))

    def row_for(self, day: datetime.date) -> Row | None:
        monday = day - datetime.timedelta(days=day.weekday())
        i = (monday - self.start).days // 7
        return self.rows[i] if 0 <= i < len(self.rows) else None

    @property
    def teaching(self) -> tuple[Row, ...]:
        return tuple(r for r in self.rows if r.deck)

    def deck_for_lab(self, lab: str) -> str | None:
        for r in self.rows:
            if r.lab == lab:
                return r.deck
        return None


def _name_under(url: str, prefix: str, what: str, week: str) -> str | None:
    """`https://<site>/<prefix><name>/` -> name; '' -> None; anything else fails."""
    if not url:
        return None
    if not (url.startswith(prefix) and url.endswith("/")):
        raise SystemExit(f"schedule: week {week}: {what} must be {prefix}<name>/ "
                         f"(got {url!r})")
    name = url[len(prefix):].strip("/")
    if not NAME_RE.match(name):
        raise SystemExit(f"schedule: week {week}: {what} names {name!r}, which is "
                         f"not a kebab-case folder name")
    return name


def load(path: Path = SCHEDULE) -> Schedule:
    if not path.is_file():
        raise SystemExit(f"schedule: {path} is missing. It is the module's only "
                         f"schedule; export it from the schedule-table builder.")
    raw = json.loads(path.read_text(encoding="utf-8"))
    try:
        start = datetime.date.fromisoformat(raw["startDate"])
    except (KeyError, TypeError, ValueError):
        raise SystemExit(f"schedule: {path} needs a startDate of the form YYYY-MM-DD")
    rows = []
    for i, w in enumerate(raw.get("weeks", [])):
        week = str(w.get("week", "")).strip()
        rows.append(Row(
            index=i,
            week=week,
            topic=str(w.get("topic", "")).strip(),
            deck=_name_under(str(w.get("lectureUrl", "")), SITE, "lectureUrl", week),
            lab=_name_under(str(w.get("labUrl", "")), SITE + "labs/", "labUrl", week),
            assessment=str(w.get("assessment", "")).strip(),
            notes=str(w.get("notes", "")).strip(),
        ))
    if not rows:
        raise SystemExit(f"schedule: {path} has no weeks")
    return Schedule(start=start, rows=tuple(rows), raw=raw)
