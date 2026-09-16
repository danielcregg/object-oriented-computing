#!/usr/bin/env python3
"""The module schedule: ONE file, module/schedule.json, that every view derives from.

module/schedule.json is an export from the lecturer's module-schedule-table-builder
app (https://github.com/danielcregg/module-schedule-table-builder). It is edited
there and re-exported here, and it is the same file the Moodle course-page table
is generated from (scripts/build_moodle_schedule.py). The site index, README's
banner and schedule table, the labs index order and the CI gate
(scripts/check_schedule.py) all import this module and read that file. The
week folders under lectures-and-labs/ are named from it (week01, week02, ...,
and the reading week as weekNNb-reading-week right after week NN), and the
gate fails if a folder disagrees. Nothing else in the repo may state a
semester date, and no deck or lab states its week.

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
# One folder per schedule row. A teaching week holds <topic>-lecture.md; a lab
# week also holds <topic>_lab/ with README.md (the instructions) and Main.java,
# whose Java package is that folder path (`package week05.arrays_lab;`), so
# this is the source root. MCQ weeks and the reading week hold README.md.
ROOT = Path("lectures-and-labs")
MCQ_RE = re.compile(r"^MCQ (\d)$")
NAME_RE = re.compile(r"^[a-z0-9-]+$")


@dataclass(frozen=True)
class Row:
    index: int          # position in the semester, 0-based, reading week included
    week: str           # "1".."12", or "X" for the reading week
    topic: str          # "Arrays"; empty on MCQ and reading-week rows
    deck: str | None    # the lecture's site folder (/<deck>/), from lectureUrl
    lab: str | None     # the lab's site folder (/labs/<lab>/), from labUrl
    assessment: str     # "MCQ 1", or empty
    notes: str
    dir: str            # its folder under lectures-and-labs/: week05, week06b-reading-week

    @property
    def is_break(self) -> bool:
        return self.week == "X"

    @property
    def mcq(self) -> str | None:
        """'1' for the MCQ 1 row, else None."""
        m = MCQ_RE.match(self.assessment)
        return m.group(1) if m else None

    @property
    def path(self) -> Path:
        return ROOT / self.dir

    @property
    def lecture(self) -> Path | None:
        """The week's lecture: lectures-and-labs/weekNN/<topic>-lecture.md."""
        return self.path / f"{self.deck}-lecture.md" if self.deck else None

    @property
    def lab_folder(self) -> str | None:
        """The lab folder's name, which is also its Java package segment: the
        topic with hyphens as underscores (a package allows no hyphen) + _lab."""
        return f"{self.deck.replace('-', '_')}_lab" if self.lab and self.deck else None

    @property
    def lab_dir(self) -> Path | None:
        return self.path / self.lab_folder if self.lab_folder else None

    @property
    def package(self) -> str | None:
        """What every Java file in the lab folder must declare."""
        return f"{self.dir}.{self.lab_folder}" if self.lab_folder else None

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

    @property
    def labs(self) -> tuple[Row, ...]:
        """The rows that have a lab, in teaching order."""
        return tuple(r for r in self.rows if r.lab)


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
    previous = 0          # the last numbered week, which names the reading-week folder
    for i, w in enumerate(raw.get("weeks", [])):
        week = str(w.get("week", "")).strip()
        if week == "X":
            folder = f"week{previous:02d}b-reading-week"
        elif week.isdigit():
            previous = int(week)
            folder = f"week{previous:02d}"
        else:
            raise SystemExit(f"schedule: row {i + 1}: week must be a number or X (got {week!r})")
        rows.append(Row(
            index=i,
            week=week,
            topic=str(w.get("topic", "")).strip(),
            deck=_name_under(str(w.get("lectureUrl", "")), SITE, "lectureUrl", week),
            lab=_name_under(str(w.get("labUrl", "")), SITE + "labs/", "labUrl", week),
            assessment=str(w.get("assessment", "")).strip(),
            notes=str(w.get("notes", "")).strip(),
            dir=folder,
        ))
    if not rows:
        raise SystemExit(f"schedule: {path} has no weeks")
    return Schedule(start=start, rows=tuple(rows), raw=raw)
