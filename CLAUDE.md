# CLAUDE.md — how to work in this repo

Source-of-truth repo for the Object-Oriented Computing module (Java, ATU).
Editable sources are Markdown, Java (labs), JSON, and HTML; images are
read-only assets.

## Map

- `weeks/week-NN-<topic>/lecture/slides.md` — Marp deck, THE canonical
  lecture. `lecture/img/` holds its images. (The original pptx archives
  were deleted 2026-08-08; they survive in git history only.)
- `labs/src/ie/atu/<topic>/` — THE canonical labs: `README.md` (the full
  instructions students follow) + `Main.java` starter per lab. Students
  fork the repo and work here (devcontainer provided); CI compiles every
  lab source file. GitHub Classroom is retired.
- Lab READMEs share one formula: title (`# Java <Topic> Lab`) → "What
  you'll learn" → "Table of Contents" → "Getting started" (standard
  block) → numbered sections → exercises as `### DIY k: <name>` with
  numbered steps + an `**Expected output**` ```text block + hints in
  `<details><summary>Hint</summary>` → Summary LAST. No Further Reading,
  no week/module references (self-contained, like the decks).
- `weeks/week-NN-<topic>/lab/lab.md` — thin pointer to the lab's canonical
  home in `labs/`. Weeks without labs say so explicitly.
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
- `practice/` — the MCQ practice web app (`index.html`, self-contained
  vanilla JS) + its question bank (`bank/<topic>.json`, one per topic).
  Bank questions are PRACTICE questions authored from the decks and labs
  — never the real Moodle assessment bank, and always self-contained (no
  schedule references). `scripts/check_practice_bank.py` validates the
  bank in CI; CI copies `practice/` to the site at `/practice/`.
- `scripts/pptx_to_marp.py` — one-shot converter used for the initial import.
- `scripts/build_index.py` — generates the Pages landing page from the
  `weeks/` tree + deck frontmatter (CI runs it; styled to match the theme).
- `scripts/build_lab_pages.py` — renders each lab README as a read-only
  styled page at `/labs/<slug>/` (CI runs it; needs `pip install markdown`).
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
  (smaller body), `centered-table`, `side` (bullets left, one image
  right). Kicker lines use
  `<span class="kicker">// ...</span>` (requires the workflow's `--html`).
- Bullet markers carry meaning: `* ` = fragmented (revealed one per keypress in
  the HTML presentation), `- ` = shown immediately. Every deck fragments its
  build-up slides; reference slides (agendas, summaries, resources, tables,
  code captions) stay immediate. A converter re-run emits `- ` everywhere,
  so re-apply fragments after any deck regeneration. Decks also set
  `transition: fade` (HTML-only slide transition; ignored in PDF/PPTX).
- Topic decks carry 3-4 fragmented predict-style beats ("Predict the
  Output", "Predict: Does This Compile?") spaced through the hour;
  answers are `* ` bullets so they reveal after the class commits.
- Speaker notes live in `<!-- Speaker notes: ... -->` comments.
- Diagrams in decks are drawn in deck-local CSS (a `<style>` block at the
  top of each `slides.md`: memory boxes, pillar strips, hierarchy trees,
  call-stack frames…) — no image files and no build pipeline. The only
  tracked deck image is week-01's About-Me banner. Lab READMEs use
  ```mermaid fences, rendered natively by GitHub and client-side on the
  lab pages.
- Topic decks (weeks 2+) share one flow: title (lead + kicker) →
  problem-first hook (1-2 slides) → "the idea" → agenda → context (the
  four-pillars strip on OOP-pillar weeks) → concepts with worked examples
  and predict beats → benefits/common mistakes → summary. Every deck ends
  on its Summary slide — no resources slides. Week 1 (module intro) is a
  two-act exception (module logistics + Java fast-start) but follows the
  same hook-first, Summary-last frame.
- Decks are SELF-CONTAINED, reusable in other courses: never reference
  other weeks/decks or the module schedule ("recall from week 7", "next
  week", pillar week-tags). Concept back-references without schedule
  coupling ("Recall: …", "as you've seen") are fine. Exempt: title-slide
  kickers, frontmatter `week:`, and week-01's module-logistics act.

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

Checks tracked extensions, path placement, and tracked text content
for leaked student data and Moodle tokens (pptx-internal checks remain
in the script but are vacuous since the pptx archives were deleted). A known-safe mention (a
whitelisted Classroom URL, or this pattern's own name — plain or backtick-quoted) only clears
a match it fully covers — real content extending past one, even glued
on with no separating space, still surfaces. Classroom `/classrooms/`
URLs clear only by exact whitelist, not by shape — add a newly
referenced one to `CLASSROOMS_WHITELIST` in the script, or it will
surface for review instead of being silently trusted.
