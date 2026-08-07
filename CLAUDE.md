# CLAUDE.md — how to work in this repo

Source-of-truth repo for the OOC1 module (Java, ATU). Editable sources are
Markdown, Moodle XML, JSON, and HTML; binaries (`original/*.pptx`, images)
are read-only archives.

## Map

- `weeks/week-NN-<topic>/lecture/slides.md` — Marp deck, THE canonical lecture.
  Edit this, never the pptx. `lecture/img/` holds extracted images;
  `lecture/original/*.pptx` is the untouched source deck (read-only reference).
- `weeks/week-NN-<topic>/lab/lab.md` — lab page: Classroom invitation link,
  starter repo, and a synced snapshot of the starter repo's README (the
  canonical lab instructions). Edits made here must be pushed to the starter
  repo too. Weeks without labs say so explicitly.
- `weeks/week-05-mcq1|week-09-mcq2|week-13-mcq3/` — assessment weeks. Each
  holds `questions.xml` (Moodle XML for that MCQ, split from the full export).
- `module/question-bank/` — the full 2025–26 Moodle question-bank export
  (canonical; includes shared/sample banks). Regenerate the per-week splits
  with `python scripts/split_question_bank.py`.
- `module/` — syllabus, future-improvements, Moodle course-page HTML assets,
  `delivery-plan-2026-27.md` (the confirmed 12-week restructure blueprint),
  and `schedule-table/` (builder template for the Moodle schedule table).
- `docs/superpowers/` — the design spec and the (amended) build and fix-wave plans this
  repo was created from; execution history, not module content.
- Rendered decks: checkout the `gh-pages` branch or download the
  `rendered-decks` workflow artifact (GitHub Pages serving is not enabled).
- `scripts/pptx_to_marp.py` — one-shot converter used for the initial import.
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
- Bullet markers carry meaning: `* ` = fragmented (revealed one per keypress in
  the HTML presentation), `- ` = shown immediately. Week 1 uses fragments;
  a converter re-run emits `- ` everywhere, so re-apply fragments after any
  deck regeneration.
- Speaker notes live in `<!-- Speaker notes: ... -->` comments.

## Editing rules

- To change a lecture: edit its `slides.md` and push — CI re-renders decks.
- To add week N: create `weeks/week-NN-<topic>/lecture/slides.md` (+ `lab/lab.md`),
  then add a row to README's schedule table.
- Known quirk: two week-7 folders (strings + reading-week) and a
  syllabus/folder numbering mismatch — see `module/future-improvements.md`
  before renumbering anything. Renumbering also touches
  `scripts/split_question_bank.py` TARGETS, `module/question-bank/README.md`,
  and `module/schedule-table/`.

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
