# Object-Oriented Computing

Private source-of-truth repo for the **Object-Oriented Computing** module
(Java, semester 1) at Atlantic Technological University — organised so both
humans and AI tools can read, parse, and update every piece of module content.

**Live slides:** https://danielcregg.is-a.dev/object-oriented-computing/

Lectures are **Marp markdown** (`weeks/*/lecture/slides.md`) — edit the
markdown, push, and CI re-renders the HTML slides and a PDF. Labs are plain Java under
`labs/src/ie/atu/<topic>/`, each with its instructions in a README.

## Module schedule

<!-- current-week:start -->
> 🗓️ **Semester has not started yet** — teaching begins the week of 14 Sep 2026.
<!-- current-week:end -->

| Week | Topic | Lecture | Lab |
|---|---|---|---|
| 1 | Introduction | [slides](weeks/week-01-introduction/lecture/slides.md) | _no lab in week 1_ |
| 2 | Classes and Objects | [slides](weeks/week-02-classes-and-objects/lecture/slides.md) | [lab](labs/src/ie/atu/classesandobjects/) |
| 3 | Methods | [slides](weeks/week-03-methods/lecture/slides.md) | [lab](labs/src/ie/atu/methods/) |
| 4 | Arrays | [slides](weeks/week-04-arrays/lecture/slides.md) | [lab](labs/src/ie/atu/arrays/) |
| 5 | **MCQ 1** (33%) | [details](weeks/week-05-mcq1/README.md) | — |
| 6 | Strings | [slides](weeks/week-06-strings/lecture/slides.md) | [lab](labs/src/ie/atu/strings/) |
| — | Reading week | [details](weeks/week-06b-reading-week/README.md) | — |
| 7 | Encapsulation | [slides](weeks/week-07-encapsulation/lecture/slides.md) | [lab](labs/src/ie/atu/encapsulation/) |
| 8 | Inheritance | [slides](weeks/week-08-inheritance/lecture/slides.md) | [lab](labs/src/ie/atu/inheritance/) |
| 9 | **MCQ 2** (33%) | [details](weeks/week-09-mcq2/README.md) | — |
| 10 | Polymorphism | [slides](weeks/week-10-polymorphism/lecture/slides.md) | [lab](labs/src/ie/atu/polymorphism/) |
| 11 | Abstraction | [slides](weeks/week-11-abstraction/lecture/slides.md) | [lab](labs/src/ie/atu/abstraction/) |
| 12 | **MCQ 3** (33%) | [details](weeks/week-12-mcq3/README.md) | — |

**Scheduling rule:** reading week always falls on the week of the Irish
October bank holiday, with 6 teaching weeks before it and 6 after.

**Assessment:** three MCQs (weeks 5, 9, 12), held during lab slots —
no projects.

## Labs

All labs live in this repository — **[labs/](labs/README.md)** — one
folder per lab with the instructions (README) and a runnable `Main.java`
starter. Students: **fork this repo, open a Codespace on your fork**
(the devcontainer gives you a ready Java IDE), pick a lab folder, and
follow its README. Read-only lab pages are also published on the
[live site](https://danielcregg.is-a.dev/object-oriented-computing/labs/).
GitHub Classroom is retired.

## MCQ practice

Self-test quizzes generated from the module's own content:
**[MCQ practice](https://danielcregg.is-a.dev/object-oriented-computing/practice/)** —
pick your topics, then exam mode (30 questions, 60-minute timer) or
instant-feedback practice mode. Per-topic progress is stored in your
browser only. The practice bank (`practice/bank/`) is authored for this
purpose and is separate from any assessment material.

## Module info

- [Module overview — weekly topics and what each week covers](module/module-overview.md)
- [Delivery plan 2026-27 (12 weeks, plus the open backlog)](module/delivery-plan-2026-27.md)
- [Moodle course-page assets](module/moodle-assets/README.md)

## Related repos

| Repo | Purpose |
|---|---|
| [REDACTED](https://github.com/danielcregg/REDACTED) | Worked lab solutions by topic |
| [marp-to-pages-template](https://github.com/danielcregg/marp-to-pages-template) | Origin of the Marp CI workflow |

## For AI tools

Read [`CLAUDE.md`](CLAUDE.md) first — it defines the conventions this repo
guarantees (frontmatter schema, naming, what must never be committed).
