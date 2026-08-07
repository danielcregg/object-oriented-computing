# Delivery Plan — 2026-27 (12 teaching weeks)

> **Status: executed in this repo on 2026-08-07** — the `weeks/` tree now
> follows this structure (Structure removed; weeks renumbered).

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

The existing question bank (kept in the private question-bank folder outside
this repo) requires three moves to align with this structure:

- Arrays: move from MCQ2 to MCQ1
- Inheritance: move from MCQ3 to MCQ2
- Retire or review Structure + Introduction questions currently in MCQ1 that test dropped material

After re-mapping the categories in Moodle, re-export the bank to the private question-bank folder kept outside this repo (question content is never committed here).

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
