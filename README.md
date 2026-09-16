# Object-Oriented Computing

Everything for the **Object-Oriented Computing** module (Java, semester 1)
at Atlantic Technological University: the lectures, the labs, and a
practice-exam app.

### Start here → **[danielcregg.is-a.dev/object-oriented-computing](https://danielcregg.is-a.dev/object-oriented-computing/)**

That's the whole module in one page — every lecture, every lab, and the
MCQ practice, all readable in the browser with nothing to install.

**Doing the labs?** You need your own copy: click **Use this template →
Create a new repository** (the green button, top-right; not *Fork*). Name
it **object-oriented-computing-module** and set it to **Private**: it's
your work. Then on *your* repo choose **Code → Codespaces → Create
codespace**: a full Java setup opens in your browser, nothing to install.
Everything is in **[lectures-and-labs/](lectures-and-labs/README.md)**, one
folder per week: open the week's lab folder and follow its README.

**Practising for the MCQs?** Use the
[practice app](https://danielcregg.is-a.dev/object-oriented-computing/practice/)
on the live site. The copy in `practice/` is its source and needs a web
server to run — opening the file directly won't load any questions.

<details>
<summary>How the repo is put together (for maintainers)</summary>

Each week is a folder, `lectures-and-labs/weekNN/`, named from the
schedule. Lectures are **Marp markdown** (`<topic>-lecture.md`) — edit
the markdown, push, and CI re-renders the HTML slides and a PDF, then
publishes the site straight from the workflow, where each lecture keeps a
topic address (`/arrays/`) whatever week it moves to. Labs are plain Java
in the week's `<topic>_lab/` folder: a `README.md` with the instructions
and a `Main.java` starter in `package weekNN.<topic>_lab`. Conventions and
editing rules live in
[`AGENTS.md`](AGENTS.md).

</details>

## Module schedule

<!-- current-week:start -->
> 🗓️ **Current teaching week: 1 — Introduction** (week beginning 14 Sep 2026).
<!-- current-week:end -->

The schedule is defined once, in [`module/schedule.json`](module/schedule.json);
this table, the banner above, the site and the Moodle course page are all
generated from it.

<!-- schedule-table:start -->
| Week | Topic | Lecture | Lab |
|---|---|---|---|
| **➡️ 1** | Introduction | [lecture](lectures-and-labs/week01/introduction-lecture.md) | _No lab in week 1_ |
| 2 | Classes and Objects | [lecture](lectures-and-labs/week02/classes-and-objects-lecture.md) | [lab](lectures-and-labs/week02/classes_and_objects_lab/README.md) |
| 3 | Methods | [lecture](lectures-and-labs/week03/methods-lecture.md) | [lab](lectures-and-labs/week03/methods_lab/README.md) |
| 4 | **MCQ 1** · held during lab slot | [details](lectures-and-labs/week04/README.md) · [brief](mcq/README.md) | — |
| 5 | Arrays | [lecture](lectures-and-labs/week05/arrays-lecture.md) | [lab](lectures-and-labs/week05/arrays_lab/README.md) |
| 6 | Strings | [lecture](lectures-and-labs/week06/strings-lecture.md) | [lab](lectures-and-labs/week06/strings_lab/README.md) |
| — | Reading week | [details](lectures-and-labs/week06b-reading-week/README.md) | — |
| 7 | Encapsulation | [lecture](lectures-and-labs/week07/encapsulation-lecture.md) | [lab](lectures-and-labs/week07/encapsulation_lab/README.md) |
| 8 | **MCQ 2** · held during lab slot | [details](lectures-and-labs/week08/README.md) · [brief](mcq/README.md) | — |
| 9 | Inheritance | [lecture](lectures-and-labs/week09/inheritance-lecture.md) | [lab](lectures-and-labs/week09/inheritance_lab/README.md) |
| 10 | Polymorphism | [lecture](lectures-and-labs/week10/polymorphism-lecture.md) | [lab](lectures-and-labs/week10/polymorphism_lab/README.md) |
| 11 | Abstraction | [lecture](lectures-and-labs/week11/abstraction-lecture.md) | [lab](lectures-and-labs/week11/abstraction_lab/README.md) |
| 12 | **MCQ 3** · held during lab slot | [details](lectures-and-labs/week12/README.md) · [brief](mcq/README.md) | — |
<!-- schedule-table:end -->

## Lectures and labs

Every week has a folder in
**[lectures-and-labs/](lectures-and-labs/README.md)**: the lecture
(`<topic>-lecture.md`) and, in a lab week, a `<topic>_lab/` folder holding
the instructions (`README.md`) and a runnable `Main.java` starter.
Students: **Use this template** to make your own copy, open a Codespace on
it (the devcontainer gives you a ready Java IDE), open the week's lab
folder, and follow its README. Read-only lab pages
are also published on the
[live site](https://danielcregg.is-a.dev/object-oriented-computing/labs/),
which always shows the current instructions — so if a lab is corrected
mid-semester, read it there.

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
