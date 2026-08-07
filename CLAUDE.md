# CLAUDE.md — how to work in this repo

Source-of-truth repo for the Object-Oriented Computing module (Java, ATU).
Editable sources are Markdown, JSON, and HTML; binaries (`original/*.pptx`,
images) are read-only archives.

## Map

- `weeks/week-NN-<topic>/lecture/slides.md` — Marp deck, THE canonical lecture.
  Edit this, never the pptx. `lecture/img/` holds extracted images;
  `lecture/original/*.pptx` is the untouched source deck (read-only reference).
- `weeks/week-NN-<topic>/lab/lab.md` — lab page: Classroom invitation link,
  starter repo, and a synced snapshot of the starter repo's README (the
  canonical lab instructions). Edits made here must be pushed to the starter
  repo too. Weeks without labs say so explicitly.
- `weeks/week-05-mcq1|week-09-mcq2|week-12-mcq3/` — assessment weeks.
  MCQ question content lives in Moodle only — never commit it here.
- `module/` — module-overview (weekly topics + per-week summaries),
  syllabus, future-improvements, Moodle course-page HTML assets,
  `delivery-plan-2026-27.md` (the confirmed 12-week restructure blueprint),
  and `schedule-table/` (builder template for the Moodle schedule table).
- `docs/superpowers/` — the design spec and the (amended) build and fix-wave plans this
  repo was created from; execution history, not module content.
- Rendered decks are PUBLIC on GitHub Pages:
  https://danielcregg.is-a.dev/object-oriented-computing/ (one folder per
  week: index.html + slides.pdf + slides.pptx). The repo stays private;
  only rendered lecture decks are published — never labs' answer keys,
  question banks, or module internals. Anything pushed to a deck goes
  public within minutes.
- `scripts/pptx_to_marp.py` — one-shot converter used for the initial import.
- `scripts/build_index.py` — generates the Pages landing page from the
  `weeks/` tree + deck frontmatter (CI runs it; styled to match the theme).
- `.github/workflows/marp.yml` — renders every `weeks/*/lecture/slides.md`
  to HTML/PDF/PPTX on push (gh-pages branch + build artifact).

## Conventions (guaranteed repo-wide)

- Folder/file names: kebab-case, no spaces.
- Every `slides.md` and `lab.md` starts with YAML frontmatter:
  `title`, `week` (int), `topic` (kebab slug), `type` (`lecture`|`lab`),
  `source` (original filename, `authored`, or for lab snapshots
  `"<starter-repo> README.md (synced YYYY-MM-DD)"`). Lecture decks also have
  `marp: true`, `theme`, `paginate`.
- Slides are separated by `---` on its own line; slide 1 uses `#`, the rest `##`.
- All decks use the repo theme `themes/ooc.css` (`theme: ooc` in frontmatter) —
  edit the theme file to restyle every deck at once. Per-slide classes via
  `<!-- _class: ... -->`: `lead` (title/divider), `cols` (2-column bullets),
  `grid2` (side-by-side images), `logos` (borderless logo row), `dense`
  (smaller body), `centered-table`. Kicker lines use
  `<span class="kicker">// ...</span>` (requires the workflow's `--html`).
- Bullet markers carry meaning: `* ` = fragmented (revealed one per keypress in
  the HTML presentation), `- ` = shown immediately. Week 1 uses fragments;
  a converter re-run emits `- ` everywhere, so re-apply fragments after any
  deck regeneration.
- Speaker notes live in `<!-- Speaker notes: ... -->` comments.

## Editing rules

- To change a lecture: edit its `slides.md` and push — CI re-renders decks.
- To add week N: create `weeks/week-NN-<topic>/lecture/slides.md` (+ `lab/lab.md`),
  then add a row to README's schedule table.
- Week folders follow the 2026-27 plan: 12 numbered weeks plus the
  deliberately unnumbered `weeks/week-06b-reading-week/` (October
  bank-holiday week, no teaching — it sits between teaching weeks 6 and 7).
  Renumbering weeks also touches README's schedule table,
  `module/schedule-table/module-schedule.json`, and this file.

## Local preview (before committing)

    npm install          # once per machine — pinned marp-cli, same version as CI
    npm run preview      # live server over weeks/ -> http://localhost:8080

Browse to any deck (e.g. `/week-01-introduction/lecture/slides.md`); edit the
markdown, refresh the browser to see it. `npm run preview:intro` opens a
self-refreshing preview window instead, and the Marp for VS Code extension
gives instant side-panel previews while editing. Preview locally first —
CI re-renders the published decks only on push.

## Never commit

- Student personal data of any kind (names, IDs, grades, submissions).
- Exam papers or solutions.
- Moodle web-service tokens (they live in the private `REDACTED` repo,
  `REDACTED`; the Moodle URL https://vlegalwaymayo.atu.ie is fine).
- Bulk third-party materials (textbook dumps, book PDFs).

Safety audit before any push (must print nothing):

    python scripts/safety_audit.py

Checks tracked extensions, path placement (including pptx location),
tracked text content, and every pptx's internal XML/rels parts (plus
any embedded office object inside a pptx, flagged for manual review)
for leaked student data and Moodle tokens. A known-safe mention (a
whitelisted Classroom URL, or this pattern's own name — plain or backtick-quoted) only clears
a match it fully covers — real content extending past one, even glued
on with no separating space, still surfaces. Classroom `/classrooms/`
URLs clear only by exact whitelist, not by shape — add a newly
referenced one to `CLASSROOMS_WHITELIST` in the script, or it will
surface for review instead of being silently trusted.
