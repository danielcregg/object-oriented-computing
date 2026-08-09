#!/usr/bin/env python3
"""Generate the GitHub Pages landing page(s) for the lecture decks.

Main page (OUTPUT_DIR/index.html): scans weeks/ in folder order and emits
one timeline row per week — lecture weeks get title + slides/lab buttons
(downloads live in the repo, linked once from the intro), MCQ weeks and
reading week render as "// comment" marker rows.

The page carries the visual identity of themes/ooc.css ("the lecture as
source code"): paper background, editor-gutter rail, "week N" labels set
like line numbers, mono headings ending in an orange semicolon.

Usage:
    python scripts/build_index.py [OUTPUT_DIR]     # default: build
"""
import html
import re
import sys
from pathlib import Path

WEEKS = Path("weeks")

TITLE_RE = re.compile(r'^title:\s*"?([^"\n]+?)"?\s*$', re.MULTILINE)
WEEK_NO_RE = re.compile(r"week-(\d+)")

MCQ_LABELS = {
    "mcq1": "MCQ 1 &middot; held during the lab slot &middot; 33% of the module",
    "mcq2": "MCQ 2 &middot; held during the lab slot &middot; 33% of the module",
    "mcq3": "MCQ 3 &middot; held during the lab slot &middot; 33% of the module",
}
READING_LABEL = "reading week &middot; October bank-holiday week &middot; no lecture or lab"

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
  .marker { color: var(--muted); font-family: var(--mono); font-size: 15.5px; }
  .marker .comment::before { content: '// '; color: var(--orange); }
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
  open right in your browser. PDF and PowerPoint versions of every deck live
  <a href="https://github.com/danielcregg/object-oriented-computing/tree/gh-pages">in
  the repository</a> if you want a download. Also here:
  <a href="labs/">all the labs</a> &middot;
  <a href="practice/">MCQ practice</a>.</p>
</header>
<main>
<ol class="timeline">
"""

MAIN_FOOT = """</ol>
</main>
<footer>
  <p class="comment">rebuilt automatically from the module's markdown sources</p>
  <p class="comment">Atlantic Technological University</p>
</footer>
</body>
</html>
"""

def lab_slug(folder: str) -> str | None:
    slug = re.sub(r"^week-\d+-", "", folder).replace("-", "")
    return slug if (Path("labs/src/ie/atu") / slug).is_dir() else None


def lecture_row(folder: str, week_no: str, title: str) -> str:
    t = html.escape(title)
    slug = lab_slug(folder)
    lab = (f'      <a class="open" href="labs/{slug}/"'
           f' aria-label="Week {week_no}: {t} — lab">lab</a>\n') if slug else ""
    return (f'  <li class="row lecture">\n'
            f'    <span class="num" data-week aria-hidden="true">{week_no}</span>\n'
            f'    <span class="topic"><a href="{folder}/index.html">{t}</a></span>\n'
            f'    <span class="actions">\n'
            f'      <a class="open" href="{folder}/index.html"'
            f' aria-label="Week {week_no}: {t} — open slides">slides</a>\n'
            f'{lab}'
            f'    </span>\n'
            f'  </li>\n')


def marker_row(week_no: str, label: str) -> str:
    num_attr = ' data-week' if week_no else ''
    return (f'  <li class="row marker">\n'
            f'    <span class="num"{num_attr} aria-hidden="true">{week_no}</span>\n'
            f'    <span class="comment">{label}</span>\n'
            f'    <span></span>\n'
            f'  </li>\n')


def deck_title(deck: Path, slug: str) -> str:
    m = TITLE_RE.search(deck.read_text(encoding="utf-8"))
    return m.group(1) if m else slug.replace("-", " ").title()


def build_main_rows() -> tuple[str, int, int]:
    rows, lectures, markers = [], 0, 0
    for folder in sorted(p for p in WEEKS.iterdir() if p.is_dir()):
        name = folder.name
        week_match = WEEK_NO_RE.match(name)
        week_no = week_match.group(1).lstrip("0") if week_match else ""
        slug = name.split("-", 2)[-1]
        deck = folder / "lecture" / "slides.md"
        if slug in MCQ_LABELS:
            rows.append(marker_row(week_no, MCQ_LABELS[slug]))
            markers += 1
        elif "reading-week" in name:
            rows.append(marker_row("", READING_LABEL))
            markers += 1
        elif deck.is_file():
            rows.append(lecture_row(name, week_no, deck_title(deck, slug)))
            lectures += 1
    return "".join(rows), lectures, markers


def main() -> None:
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    out_dir.mkdir(parents=True, exist_ok=True)

    rows, lectures, markers = build_main_rows()
    page = (page_head("Object-Oriented Computing &mdash; Lecture Decks")
            + MAIN_HEADER + rows + MAIN_FOOT)
    (out_dir / "index.html").write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {out_dir / 'index.html'} ({lectures} lectures, {markers} marker rows)")


if __name__ == "__main__":
    main()
