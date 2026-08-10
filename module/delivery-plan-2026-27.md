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

GitHub Classroom is retired — the labs live in `labs/src/ie/atu/<topic>/`
and students fork this repo, so there are no assignment names to keep in
step with the week numbers any more.

If a Moodle schedule table is wanted for 2026-27, build it in the
[module-schedule-table-builder](https://github.com/danielcregg/module-schedule-table-builder)
app against the 12-week layout above and paste the result into the course
page.

## Backlog

Still open for a future delivery:

- **AI-generated lecture audio** (NotebookLM) as a revision aid per topic.
- **Possible move to Python** — teach OO in Python first, then Java OO in
  semester 2. A whole-module decision, not a tweak.

Done and kept here so the same ground isn't re-covered: the 12-week move
(2026-08-07), the cross-deck de-duplication and the shortened polymorphism
lab (2026-08-08), Expected-output blocks on every lab DIY, and the
devcontainer speed question — a Codespaces prebuild does **not** help,
because a student's fork is a separate repository and gets no prebuild
from this one; the stock Java image with no devcontainer features is
already the fast path.
