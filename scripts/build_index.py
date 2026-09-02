#!/usr/bin/env python3
"""Generate the GitHub Pages landing page from module/schedule.json.

One timeline row per row of the schedule, in schedule order: lecture weeks get
the topic + slides/lab/pdf buttons, MCQ weeks and the reading week render as
"// comment" marker rows. Week numbers, topics, deck folders and lab links all
come from the schedule (scripts/schedule.py); nothing here is derived from
folder names, and nothing here states a week number of its own.

The page carries the visual identity of themes/ooc.css ("the lecture as
source code"): paper background, editor-gutter rail, "week N" labels set
like line numbers, mono headings ending in an orange semicolon.

A few lines of inline JS highlight the current row like an editor's current
line. The schedule's startDate is baked into the page and the row index is
whole weeks since it, so the highlight moves without a rebuild.
`?date=YYYY-MM-DD` previews any date.

The deck folders carried week numbers until 2026-09; each old name gets a
one-line redirect page so links made before the rename still resolve.

Usage:
    python scripts/build_index.py [OUTPUT_DIR]     # default: build
"""
from __future__ import annotations

import html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import Row, Schedule, load  # noqa: E402

READING_LABEL = "reading week &middot; October bank-holiday week &middot; no lecture or lab"

# Folder names before the schedule became the single source of truth. Delete
# this table once nothing links to the old names any more.
OLD_FOLDERS = {
    "week-01-introduction": "introduction",
    "week-02-classes-and-objects": "classes-and-objects",
    "week-03-methods": "methods",
    "week-04-arrays": "arrays",
    "week-05-mcq1": "mcq1",
    "week-06-strings": "strings",
    "week-06b-reading-week": "reading-week",
    "week-07-encapsulation": "encapsulation",
    "week-08-inheritance": "inheritance",
    "week-09-mcq2": "mcq2",
    "week-10-polymorphism": "polymorphism",
    "week-11-abstraction": "abstraction",
    "week-12-mcq3": "mcq3",
}

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' "
           "fill='%23FBFAF7'/%3E%3Ctext x='16' y='25' font-family='Consolas,monospace' "
           "font-size='26' font-weight='700' fill='%23E76F00' "
           "text-anchor='middle'%3E;%3C/text%3E%3C/svg%3E")

STYLE = """<style>
  :root {
    --paper: #FBFAF7; --ink: #1E2833; --blue: #33698C; --orange: #E76F00;
    --slate: #46536B; --rule: #DED8C9; --muted: #8B8471; --gutter-num: #AFA893;
    --tint: #F3EFE5;
    --mono: 'Cascadia Code', 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
    --sans: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color-scheme: light;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: var(--sans); color: var(--ink);
    background: linear-gradient(to right,
      var(--paper) 0, var(--paper) 104px,
      var(--rule) 104px, var(--rule) 106px,
      var(--paper) 106px, var(--paper) 100%);
    min-height: 100vh; line-height: 1.5;
  }
  a:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; border-radius: 4px; }
  header { padding: 64px 40px 40px 140px; max-width: 980px; }
  .kicker { font-family: var(--mono); font-size: 15px; color: var(--muted); letter-spacing: 0.01em; }
  .kicker::before { content: '// '; color: var(--orange); }
  h1 {
    font-family: var(--mono); font-weight: 600; letter-spacing: -0.015em;
    font-size: clamp(30px, 4.6vw, 50px); margin: 10px 0 14px;
  }
  h1::after { content: ';'; color: var(--orange); }
  .standfirst { color: var(--slate); font-size: 17px; max-width: 54ch; }
  main { max-width: 980px; padding-bottom: 24px; }
  ol.timeline { list-style: none; padding: 0; }
  .row {
    display: grid; grid-template-columns: 104px minmax(0, 1fr) auto;
    align-items: baseline; column-gap: 34px;
    border-bottom: 1px solid var(--rule); padding: 18px 40px 18px 0;
    transition: background-color 120ms ease;
  }
  .row:first-child { border-top: 1px solid var(--rule); }
  .num {
    font-family: var(--mono); font-size: 17px; color: var(--gutter-num);
    text-align: right; padding-right: 16px;
    transition: color 120ms ease;
  }
  .num[data-week]::before { content: 'week '; }
  .lecture:hover { background: var(--tint); }
  .lecture:hover .num, .lecture:focus-within .num { color: var(--orange); }
  .topic { font-family: var(--mono); font-weight: 600; font-size: 21px; letter-spacing: -0.01em; }
  .topic a { color: var(--ink); text-decoration: none; }
  .topic a:hover { color: var(--blue); }
  .actions {
    display: flex; align-items: center; gap: 18px;
    font-family: var(--mono); font-size: 14.5px; white-space: nowrap;
  }
  .actions .open {
    color: var(--blue); border: 1.5px solid var(--blue); border-radius: 7px;
    padding: 4px 13px; text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;
  }
  .actions .open:hover { background: var(--blue); color: var(--paper); }
  /* pdf: deliberately quiet -- the deck and lab are the actions that matter,
     but this is now the only route to a downloadable copy. */
  .actions .dl { color: var(--muted); text-decoration: none; font-size: 13.5px; }
  .actions .dl:hover { color: var(--blue); text-decoration: underline; }
  .marker { color: var(--muted); font-family: var(--mono); font-size: 15.5px; }
  .marker .comment::before { content: '// '; color: var(--orange); }
  .row.current { background: var(--tint); box-shadow: inset 3px 0 0 var(--orange); }
  .row.current .num { color: var(--orange); }
  .now {
    font-family: var(--mono); font-weight: 400; font-size: 13.5px;
    color: var(--orange); margin-left: 14px; white-space: nowrap;
  }
  footer {
    padding: 30px 40px 56px 140px; max-width: 980px;
    font-family: var(--mono); font-size: 13.5px; color: var(--gutter-num);
  }
  footer p + p { margin-top: 4px; }
  footer .comment::before { content: '// '; color: var(--orange); }
  footer a { color: var(--slate); }
  @media (max-width: 760px) {
    body { background: var(--paper); }
    header { padding: 36px 20px 24px; }
    footer { padding: 26px 20px 44px; }
    .row { grid-template-columns: 1fr; row-gap: 12px; padding: 18px 20px; }
    .num { text-align: left; padding: 0; }
    .actions { white-space: normal; flex-wrap: wrap; gap: 14px; }
    .actions .open { padding: 12px 26px; font-size: 16.5px; }
    .topic { font-size: 23px; }
    .topic a { display: block; padding: 2px 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .row, .num, .actions .open { transition: none; }
  }
</style>"""


def page_head(title: str) -> str:
    return (f'<!doctype html>\n<html lang="en">\n<head>\n'
            f'<meta charset="utf-8">\n'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<meta name="description" content="Lecture decks for the '
            f'Object-Oriented Computing module (Java), Atlantic Technological University.">\n'
            f'<title>{title}</title>\n'
            f'<link rel="icon" href="{FAVICON}">\n{STYLE}\n</head>\n<body>\n')


MAIN_HEADER = """<header>
  <p class="kicker">Atlantic Technological University &middot; Semester 1 &middot; Java</p>
  <h1>Object-Oriented Computing</h1>
  <p class="standfirst">One lecture deck per teaching week — slides and lab
  open right in your browser, and every deck has a PDF beside it if you want
  to take it with you. Also here: <a href="labs/">all the labs</a> &middot;
  <a href="practice/">MCQ practice</a> &middot;
  <a href="mcq/">the MCQ brief</a>.</p>
</header>
<main>
<ol class="timeline">
"""

MAIN_FOOT = """</ol>
</main>
<footer>
  <p class="comment">rebuilt automatically from the module's markdown sources and module/schedule.json</p>
  <p class="comment">Atlantic Technological University</p>
</footer>
<script>
// Highlight the current row like an editor's current line. The schedule's
// start date is baked in below; the row index is whole weeks since it, and
// the rows carry data-index in schedule order (reading week included).
// ?date=YYYY-MM-DD previews any date.
(function () {
  var START = '__START__', ROWS = __ROWS__;
  var q = new URLSearchParams(location.search).get('date');
  var now = q ? new Date(q + 'T12:00:00') : new Date();
  if (isNaN(now)) now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
  var p = START.split('-');
  var start = new Date(+p[0], +p[1] - 1, +p[2]);
  var index = Math.round((monday - start) / 6048e5); // whole weeks; rounding absorbs DST
  if (index < 0 || index >= ROWS) return;
  var row = document.querySelector('.row[data-index="' + index + '"]');
  if (!row) return;
  row.classList.add('current');
  row.setAttribute('aria-current', 'true');
  var cell = row.querySelector('.topic, .comment');
  if (cell) {
    var tag = document.createElement('span');
    tag.className = 'now';
    tag.textContent = '// this week';
    cell.appendChild(tag);
  }
})();
</script>
</body>
</html>
"""


def lecture_row(row: Row) -> str:
    t = html.escape(row.topic)
    lab = (f'      <a class="open" href="labs/{row.lab}/"'
           f' aria-label="Week {row.week}: {t} — lab">lab</a>\n') if row.lab else ""
    return (f'  <li class="row lecture" data-index="{row.index}">\n'
            f'    <span class="num" data-week="{row.week}" aria-hidden="true">{row.week}</span>\n'
            f'    <span class="topic"><a href="{row.deck}/index.html">{t}</a></span>\n'
            f'    <span class="actions">\n'
            f'      <a class="open" href="{row.deck}/index.html"'
            f' aria-label="Week {row.week}: {t} — open slides">slides</a>\n'
            f'{lab}'
            f'      <a class="dl" href="{row.deck}/slides.pdf"'
            f' aria-label="Week {row.week}: {t} — download the PDF">pdf</a>\n'
            f'    </span>\n'
            f'  </li>\n')


def marker_row(row: Row) -> str:
    if row.is_break:
        week_no, label, extra = "", READING_LABEL, " data-reading"
    else:
        when = html.escape(row.notes.lower()) if row.notes else "held during the lab slot"
        label = (f"{html.escape(row.assessment)} &middot; {when} &middot; one third of the module "
                 f"&middot; <a href=\"mcq/\">read the brief</a>")
        week_no, extra = row.week, ""
    num_attr = f' data-week="{week_no}"' if week_no else ""
    return (f'  <li class="row marker"{extra} data-index="{row.index}">\n'
            f'    <span class="num"{num_attr} aria-hidden="true">{week_no}</span>\n'
            f'    <span class="comment">{label}</span>\n'
            f'    <span></span>\n'
            f'  </li>\n')


def build_rows(sched: Schedule) -> tuple[str, int, int]:
    rows, lectures, markers = [], 0, 0
    for row in sched.rows:
        if row.deck:
            rows.append(lecture_row(row))
            lectures += 1
        elif row.mcq or row.is_break:
            rows.append(marker_row(row))
            markers += 1
        else:
            raise SystemExit(
                f"build_index: schedule week {row.week!r} has no lecture, is not an "
                f"MCQ and is not the reading week; it cannot be shown. Fix "
                f"module/schedule.json.")
    return "".join(rows), lectures, markers


def redirect_page(new: str) -> str:
    return (f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
            f'<meta http-equiv="refresh" content="0; url=../{new}/">\n'
            f'<link rel="canonical" href="../{new}/">\n<title>Moved</title></head>\n'
            f'<body><p>This deck moved to <a href="../{new}/">../{new}/</a>.</p></body></html>\n')


def main() -> None:
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    out_dir.mkdir(parents=True, exist_ok=True)
    sched = load()

    rows, lectures, markers = build_rows(sched)
    foot = MAIN_FOOT.replace("__START__", sched.start.isoformat()).replace("__ROWS__", str(len(sched.rows)))
    page = page_head("Object-Oriented Computing &mdash; Lecture Decks") + MAIN_HEADER + rows + foot
    (out_dir / "index.html").write_text(page, encoding="utf-8", newline="\n")

    for old, new in OLD_FOLDERS.items():
        stub = out_dir / old
        stub.mkdir(parents=True, exist_ok=True)
        (stub / "index.html").write_text(redirect_page(new), encoding="utf-8", newline="\n")

    print(f"wrote {out_dir / 'index.html'} ({lectures} lectures, {markers} marker rows, "
          f"start {sched.start}) + {len(OLD_FOLDERS)} redirect stubs")


if __name__ == "__main__":
    main()
