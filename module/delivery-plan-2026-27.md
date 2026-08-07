# Delivery Plan — 2026-27 (12 teaching weeks)

Stated by the lecturer on 2026-08-07. Anchor rule: reading week always falls
on the Irish October bank-holiday week — 6 teaching weeks before it, 6 after.
All MCQs are held during the lab slot of their week.

| Teaching week | Content | Notes |
|---|---|---|
| 1 | Module introduction lecture | No lab in week 1 |
| 2 | Classes and Objects | |
| 3 | Methods | |
| 4 | Arrays | |
| 5 | **MCQ 1** | During lab slot |
| 6 | Strings | |
| — | Reading week | October bank-holiday week; no lectures or labs |
| 7 | Encapsulation | |
| 8 | Inheritance | |
| 9 | **MCQ 2** | During lab slot |
| 10 | Polymorphism | |
| 11 | Abstraction | |
| 12 | **MCQ 3** | During lab slot |

## Mapping from current content

The repo originally held 10 lecture topics (Introduction, Structure,
Classes and Objects, Methods, Arrays, Strings, Encapsulation, Inheritance,
Polymorphism, Abstraction). **Structure is dropped as a standalone week** — its fundamentals
(program anatomy, compilation, variables, data types) move into the week-1 intro
(as a Java fast-start) and/or the opening of Classes and Objects. Final placement
is the lecturer's call when overhauling the intro deck.

### MCQ bank re-mapping

The existing question banks (`module/question-bank/` + per-week `questions.xml`)
require three moves to align with this structure:

- Arrays: move from MCQ2 to MCQ1
- Inheritance: move from MCQ3 to MCQ2
- Retire or review Structure + Introduction questions currently in MCQ1 that test dropped material

After re-exporting the full Moodle bank and updating `module/question-bank/full-export-2026-27.xml`,
re-split the questions with `python scripts/split_question_bank.py`. When the export filename changes for the new year, also update `SRC` in `scripts/split_question_bank.py` (or pass `--src`) and the filename references in `module/question-bank/README.md`.

- **MCQ 1** (week 5): Introduction, Classes and Objects, Methods, Arrays
- **MCQ 2** (week 9): Strings, Encapsulation, Inheritance
- **MCQ 3** (week 12): Polymorphism, Abstraction

### Lab assignment naming

Classroom assignment names carry stale `wN` prefixes after the week shift
(e.g. `w3-lab-classes-and-objects` runs in week 2; `w10-lab-inheritance` runs in week 8).
Rename these when creating 2026-27 assignments in Classroom. The week-2
Structure lab (`w2-lab-structure`) becomes supplementary, used alongside
`wX-lab-control-flow` for the week-1 intro.

The schedule-table template (`module/schedule-table/`) should be rebuilt to
this layout when filling in real dates and links.
