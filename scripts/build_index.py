#!/usr/bin/env python3
"""Generate the GitHub Pages landing page (index.html) for the lecture decks.

Scans weeks/ in folder order and emits one timeline row per week:
  - lecture weeks  -> title from the deck's frontmatter + slides/pdf/pptx links
  - MCQ weeks      -> a "// comment" marker row (no deck to run)
  - reading week   -> a "// comment" marker row

The page carries the same visual identity as themes/ooc.css ("the lecture
as source code"): paper background, editor-gutter rail, week numbers set
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

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Lecture decks for the Object-Oriented Computing module (Java), Atlantic Technological University.">
<title>Object-Oriented Computing &mdash; Lecture Decks</title>
<link rel="icon" href="__FAVICON__">
<style>
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
    /* the decks' editor-gutter rail, painted into the page background */
    background: linear-gradient(to right,
      var(--paper) 0, var(--paper) 86px,
      var(--rule) 86px, var(--rule) 88px,
      var(--paper) 88px, var(--paper) 100%);
    min-height: 100vh; line-height: 1.5;
  }
  a:focus-visible, .row a:focus-visible {
    outline: 2px solid var(--orange); outline-offset: 2px; border-radius: 4px;
  }
  header { padding: 64px 40px 40px 122px; max-width: 980px; }
  .kicker {
    font-family: var(--mono); font-size: 15px; color: var(--muted);
    letter-spacing: 0.01em;
  }
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
    display: grid; grid-template-columns: 86px minmax(0, 1fr) auto;
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
  .lecture:hover { background: var(--tint); }
  .lecture:hover .num, .lecture:focus-within .num { color: var(--orange); }
  .topic {
    font-family: var(--mono); font-weight: 600; font-size: 21px;
    letter-spacing: -0.01em;
  }
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
  .actions .dl { color: var(--slate); text-decoration: none; }
  .actions .dl:hover { color: var(--blue); text-decoration: underline; }
  .marker { color: var(--muted); font-family: var(--mono); font-size: 15.5px; }
  .marker .comment::before { content: '// '; color: var(--orange); }
  footer {
    padding: 30px 40px 56px 122px; max-width: 980px;
    font-family: var(--mono); font-size: 13.5px; color: var(--gutter-num);
  }
  footer p + p { margin-top: 4px; }
  footer .comment::before { content: '// '; color: var(--orange); }
  @media (max-width: 760px) {
    body { background: var(--paper); }
    header { padding: 40px 20px 28px; }
    footer { padding: 26px 20px 44px; }
    .row { grid-template-columns: 1fr; row-gap: 10px; padding: 16px 20px; }
    .num { text-align: left; padding: 0; }
    .num[data-week]::before { content: 'week '; }
    .actions { white-space: normal; flex-wrap: wrap; }
  }
  @media (prefers-reduced-motion: reduce) {
    .row, .num, .actions .open { transition: none; }
  }
</style>
</head>
<body>
<header>
  <p class="kicker">Atlantic Technological University &middot; Semester 1 &middot; Java</p>
  <h1>Object-Oriented Computing</h1>
  <p class="standfirst">One lecture deck per teaching week. Open the slides in
  your browser, or take the PDF or PowerPoint version with you.</p>
</header>
<main>
<ol class="timeline">
"""

FOOT = """</ol>
</main>
<footer>
  <p class="comment">rebuilt automatically from the module's markdown sources</p>
  <p class="comment">Atlantic Technological University</p>
</footer>
</body>
</html>
"""


def lecture_row(folder: str, week_no: str, title: str) -> str:
    t = html.escape(title)
    return (f'  <li class="row lecture">\n'
            f'    <span class="num" data-week aria-hidden="true">{week_no}</span>\n'
            f'    <span class="topic"><a href="{folder}/index.html">{t}</a></span>\n'
            f'    <span class="actions">\n'
            f'      <a class="open" href="{folder}/index.html"'
            f' aria-label="Week {week_no}: {t} — open slides">slides</a>\n'
            f'      <a class="dl" href="{folder}/slides.pdf"'
            f' aria-label="Week {week_no}: {t} — PDF">pdf</a>\n'
            f'      <a class="dl" href="{folder}/slides.pptx"'
            f' aria-label="Week {week_no}: {t} — PowerPoint">pptx</a>\n'
            f'    </span>\n'
            f'  </li>\n')


def marker_row(week_no: str, label: str) -> str:
    num_attr = ' data-week' if week_no else ''
    return (f'  <li class="row marker">\n'
            f'    <span class="num"{num_attr} aria-hidden="true">{week_no}</span>\n'
            f'    <span class="comment">{label}</span>\n'
            f'    <span></span>\n'
            f'  </li>\n')


def build_rows() -> tuple[str, int, int]:
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
            text = deck.read_text(encoding="utf-8")
            m = TITLE_RE.search(text)
            title = m.group(1) if m else slug.replace("-", " ").title()
            rows.append(lecture_row(name, week_no, title))
            lectures += 1
    return "".join(rows), lectures, markers


def main() -> None:
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    out_dir.mkdir(parents=True, exist_ok=True)
    rows, lectures, markers = build_rows()
    page = HEAD.replace("__FAVICON__", FAVICON) + rows + FOOT
    out = out_dir / "index.html"
    out.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {out} ({lectures} lectures, {markers} marker rows)")


if __name__ == "__main__":
    main()
