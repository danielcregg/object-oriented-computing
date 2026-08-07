# Object-Oriented Computing

Private source-of-truth repo for the **Object-Oriented Computing** module
(Java, semester 1) at Atlantic Technological University — organised so both
humans and AI tools can read, parse, and update every piece of module content.

**Live slides:** https://danielcregg.is-a.dev/object-oriented-computing/

Lectures are **Marp markdown** (`weeks/*/lecture/slides.md`) — edit the
markdown, push, and CI re-renders HTML/PDF/PPTX. The original PowerPoint decks
are preserved untouched in each week's `lecture/original/`.

## Week schedule

| Week | Topic | Lecture | Lab |
|---|---|---|---|
| 1 | Introduction | [slides](weeks/week-01-introduction/lecture/slides.md) | [no lab](weeks/week-01-introduction/lab/lab.md) |
| 2 | Structure | [slides](weeks/week-02-structure/lecture/slides.md) | [lab](weeks/week-02-structure/lab/lab.md) |
| 3 | Classes and Objects | [slides](weeks/week-03-classes-and-objects/lecture/slides.md) | [lab](weeks/week-03-classes-and-objects/lab/lab.md) |
| 4 | Methods | [slides](weeks/week-04-methods/lecture/slides.md) | [lab](weeks/week-04-methods/lab/lab.md) |
| 5 | **MCQ 1** | [details](weeks/week-05-mcq1/README.md) | — |
| 6 | Arrays | [slides](weeks/week-06-arrays/lecture/slides.md) | [lab](weeks/week-06-arrays/lab/lab.md) |
| 7 | Strings | [slides](weeks/week-07-strings/lecture/slides.md) | [lab](weeks/week-07-strings/lab/lab.md) |
| 7* | Reading Week | [details](weeks/week-07-reading-week/README.md) | — |
| 8 | Encapsulation | [slides](weeks/week-08-encapsulation/lecture/slides.md) | [lab](weeks/week-08-encapsulation/lab/lab.md) |
| 9 | **MCQ 2** | [details](weeks/week-09-mcq2/README.md) | — |
| 10 | Inheritance | [slides](weeks/week-10-inheritance/lecture/slides.md) | [lab](weeks/week-10-inheritance/lab/lab.md) |
| 11 | Polymorphism | [slides](weeks/week-11-polymorphism/lecture/slides.md) | [lab](weeks/week-11-polymorphism/lab/lab.md) |
| 12 | Abstraction | [slides](weeks/week-12-abstraction/lecture/slides.md) | [lab](weeks/week-12-abstraction/lab/lab.md) |
| 13 | **MCQ 3** | [details](weeks/week-13-mcq3/README.md) | — |

\* Two week-7 entries mirror the source folders; the planned 12-week
restructure resolves this ([future improvements](module/future-improvements.md)).
The [2025–26 syllabus plan](module/syllabus.md) uses different week numbers —
the folders here reflect what is actually organised.

**Scheduling rule:** reading week always falls on the week of the Irish
October bank holiday, with 6 teaching weeks before it and 6 after.

**Assessment:** the module is assessed by the three MCQs (weeks 5, 9, 13)
only — projects are discontinued. An extra unscheduled Classroom lab exists,
[`wX-lab-control-flow`](REDACTED) — control
flow has no lecture week of its own; schedule it per delivery.

## Module info

- [Syllabus (2025–26 plan)](module/syllabus.md)
- [Delivery plan 2026-27 (12 weeks)](module/delivery-plan-2026-27.md)
- [Future improvements](module/future-improvements.md)
- [Moodle course-page assets](module/moodle-assets/README.md)
- [Schedule-table builder template](module/schedule-table/README.md)
- [Question bank (full 2025–26 export)](module/question-bank/README.md)

## Related repos

| Repo | Purpose |
|---|---|
| [ooc-lab-template](https://github.com/danielcregg/ooc-lab-template) | GitHub Classroom lab template (Codespaces-ready) |
| [REDACTED](https://github.com/danielcregg/REDACTED) | Worked lab solutions by topic |
| [marp-to-pages-template](https://github.com/danielcregg/marp-to-pages-template) | Origin of the Marp CI workflow |
| [OOC GitHub Classroom](https://classroom.github.com/classrooms/REDACTED) | Lab distribution — assignments, invitations, starter repos |

## For AI tools

Read [`CLAUDE.md`](CLAUDE.md) first — it defines the conventions this repo
guarantees (frontmatter schema, naming, what must never be committed).
