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

Lectures are **Marp markdown** (`weeks/*/slides.md`) — edit the
markdown, push, and CI re-renders the HTML slides and a PDF, then
publishes the site straight from the workflow. Labs are plain Java under
`labs/src/ie/atu/<topic>/`, each with its instructions in a README.
Conventions and editing rules live in [`AGENTS.md`](AGENTS.md).

</details>

## Module schedule

<!-- current-week:start -->
> 🗓️ **Semester has not started yet** — teaching begins the week of 14 Sep 2026.
<!-- current-week:end -->

The schedule is defined once, in [`module/schedule.json`](module/schedule.json);
this table, the banner above, the site and the Moodle course page are all
generated from it.

<!-- schedule-table:start -->
| Week | Topic | Lecture | Lab |
|---|---|---|---|
| 1 | Introduction | [slides](weeks/introduction/slides.md) | _No lab in week 1_ |
| 2 | Classes and Objects | [slides](weeks/classes-and-objects/slides.md) | [lab](labs/src/ie/atu/classesandobjects/) |
| 3 | Methods | [slides](weeks/methods/slides.md) | [lab](labs/src/ie/atu/methods/) |
| 4 | **MCQ 1** · held during lab slot | [details](weeks/mcq1/README.md) · [brief](mcq/README.md) | — |
| 5 | Arrays | [slides](weeks/arrays/slides.md) | [lab](labs/src/ie/atu/arrays/) |
| 6 | Strings | [slides](weeks/strings/slides.md) | [lab](labs/src/ie/atu/strings/) |
| — | Reading week | [details](weeks/reading-week/README.md) | — |
| 7 | Encapsulation | [slides](weeks/encapsulation/slides.md) | [lab](labs/src/ie/atu/encapsulation/) |
| 8 | **MCQ 2** · held during lab slot | [details](weeks/mcq2/README.md) · [brief](mcq/README.md) | — |
| 9 | Inheritance | [slides](weeks/inheritance/slides.md) | [lab](labs/src/ie/atu/inheritance/) |
| 10 | Polymorphism | [slides](weeks/polymorphism/slides.md) | [lab](labs/src/ie/atu/polymorphism/) |
| 11 | Abstraction | [slides](weeks/abstraction/slides.md) | [lab](labs/src/ie/atu/abstraction/) |
| 12 | **MCQ 3** · held during lab slot | [details](weeks/mcq3/README.md) · [brief](mcq/README.md) | — |
<!-- schedule-table:end -->

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

## MCQ brief

**[MCQ brief](https://danielcregg.is-a.dev/object-oriented-computing/mcq/)** —
the rules and the format (30 multiple-choice + 3 coding questions in
60 minutes, sequential, one attempt) that students read before each MCQ.
Source: [`mcq/README.md`](mcq/README.md), rendered to `/mcq/` by
`scripts/build_lab_pages.py`; the Moodle course links to the live page.

## MCQ practice

Self-test quizzes generated from the module's own content:
**[MCQ practice](https://danielcregg.is-a.dev/object-oriented-computing/practice/)** and
**[coding practice](https://danielcregg.is-a.dev/object-oriented-computing/practice/coding/)** —
pick your topics, then exam mode (30 questions, 60-minute timer) or
instant-feedback practice mode. Per-topic progress is stored in your
browser only. The practice bank (`practice/bank/`) is authored for this
purpose and is separate from any assessment material.

## Module info

- [Module overview — weekly topics and what each week covers](module/module-overview.md)

## For AI tools

Read [`AGENTS.md`](AGENTS.md) first — it defines the conventions this repo
guarantees (frontmatter schema, naming, what must never be committed).
`CLAUDE.md` is a one-line import of it, so Claude Code and every other
assistant read the same file.
