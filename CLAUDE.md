# CLAUDE.md — how to work in this repo

Source-of-truth repo for the OOC1 module (Java, ATU). Everything an AI needs
to read or change module content is markdown; binaries are read-only archives.

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
- `module/` — syllabus, future-improvements, Moodle course-page HTML assets.
- `scripts/pptx_to_marp.py` — one-shot converter used for the initial import.
- `.github/workflows/marp.yml` — renders every `weeks/*/lecture/slides.md`
  to HTML/PDF/PPTX on push (gh-pages branch + build artifact).

## Conventions (guaranteed repo-wide)

- Folder/file names: kebab-case, no spaces.
- Every `slides.md` and `lab.md` starts with YAML frontmatter:
  `title`, `week` (int), `topic` (kebab slug), `type` (`lecture`|`lab`),
  `source` (original filename or `authored`). Lecture decks additionally have
  `marp: true`, `theme`, `paginate`.
- Slides are separated by `---` on its own line; slide 1 uses `#`, the rest `##`.
- Speaker notes live in `<!-- Speaker notes: ... -->` comments.

## Editing rules

- To change a lecture: edit its `slides.md` and push — CI re-renders decks.
- To add week N: create `weeks/week-NN-<topic>/lecture/slides.md` (+ `lab/lab.md`),
  then add a row to README's schedule table.
- Known quirk: two week-7 folders (strings + reading-week) and a
  syllabus/folder numbering mismatch — see `module/future-improvements.md`
  before renumbering anything.

## Never commit

- Student personal data of any kind (names, IDs, grades, submissions).
- Exam papers or solutions.
- Moodle web-service tokens (they live in the private `REDACTED` repo,
  `REDACTED`; the Moodle URL https://vlegalwaymayo.atu.ie is fine).
- Bulk third-party materials (textbook dumps, book PDFs).

Safety audit before any push (must all come up empty):

    git ls-files | grep -Ei '\.(xlsx|xls|mbz|zip|class|jar)$'
    git ls-files '*.md' '*.yml' '*.py' '*.html' '*.xml' -z | \
      xargs -0 grep -HniE 'assignsubmission|G00[0-9]{6}|\b[0-9a-f]{32}\b' | \
      grep -v 'classroom\.github\.com/assignment-invitations/'
