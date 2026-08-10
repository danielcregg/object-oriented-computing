# Object-Oriented Computing

Everything for the **Object-Oriented Computing** module (Java, semester 1)
at Atlantic Technological University: the lectures, the labs, and a
practice-exam app.

### Start here → **[danielcregg.is-a.dev/object-oriented-computing](https://danielcregg.is-a.dev/object-oriented-computing/)**

That's the whole module in one page — every lecture, every lab, and the
MCQ practice, all readable in the browser with nothing to install.

**Doing the labs?** You need your own copy: click **Use this template →
Create a new repository** (green button, top-right). Name it whatever you
like and **you may set it to Private** — it's your work. Then on *your*
repo choose **Code → Codespaces → Create codespace**: a full Java setup
opens in your browser, nothing to install. Pick a lab folder under
`labs/src/ie/atu/` and follow its README. Details in
**[labs/README.md](labs/README.md)**.

**Practising for the MCQs?** Use the
[practice app](https://danielcregg.is-a.dev/object-oriented-computing/practice/)
on the live site. The copy in `practice/` is its source and needs a web
server to run — opening the file directly won't load any questions.

<details>
<summary>How the repo is put together (for maintainers)</summary>

Lectures are **Marp markdown** (`weeks/*/lecture/slides.md`) — edit the
markdown, push, and CI re-renders the HTML slides and a PDF, then
publishes the site straight from the workflow. Labs are plain Java under
`labs/src/ie/atu/<topic>/`, each with its instructions in a README.
Conventions and editing rules live in [`CLAUDE.md`](CLAUDE.md).

</details>

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
starter. Students: **Use this template** to make your own copy, open a
Codespace on it (the devcontainer gives you a ready Java IDE), pick a lab
folder, and follow its README. Read-only lab pages are also published on
the
[live site](https://danielcregg.is-a.dev/object-oriented-computing/labs/),
which always shows the current instructions — so if a lab is corrected
mid-semester, read it there. GitHub Classroom is retired.

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

## For AI tools

Read [`CLAUDE.md`](CLAUDE.md) first — it defines the conventions this repo
guarantees (frontmatter schema, naming, what must never be committed).
