# Lectures and Labs

Everything for each week of the module is here, one folder per week, in
order. A teaching week's folder holds:

- **`<topic>-lecture.md`**: that week's lecture slides (for example
  `arrays-lecture.md`),
- **`<topic>_lab/`**: the lab, with its **`README.md`** (the instructions)
  and a runnable **`Main.java`** starter. Your own code goes in that folder
  too.

The MCQ weeks and the reading week hold just a `README.md` saying what
happens that week. In a Codespace every `.md` file opens ready to read, and
a lecture opens as slides; in VS Code on your own computer, right-click a
file → *Open Preview*.

<!-- schedule-table:start -->
| Week | Topic | Lecture | Lab |
|---|---|---|---|
| **➡️ 1** | Introduction | [lecture](week01/introduction-lecture.md) | _No lab in week 1_ |
| 2 | Classes and Objects | [lecture](week02/classes-and-objects-lecture.md) | [lab](week02/classes_and_objects_lab/README.md) |
| 3 | Methods | [lecture](week03/methods-lecture.md) | [lab](week03/methods_lab/README.md) |
| 4 | **MCQ 1** · held during lab slot | [details](week04/README.md) · [brief](../mcq/README.md) | — |
| 5 | Arrays | [lecture](week05/arrays-lecture.md) | [lab](week05/arrays_lab/README.md) |
| 6 | Strings | [lecture](week06/strings-lecture.md) | [lab](week06/strings_lab/README.md) |
| — | Reading week | [details](week06b-reading-week/README.md) | — |
| 7 | Encapsulation | [lecture](week07/encapsulation-lecture.md) | [lab](week07/encapsulation_lab/README.md) |
| 8 | **MCQ 2** · held during lab slot | [details](week08/README.md) · [brief](../mcq/README.md) | — |
| 9 | Inheritance | [lecture](week09/inheritance-lecture.md) | [lab](week09/inheritance_lab/README.md) |
| 10 | Polymorphism | [lecture](week10/polymorphism-lecture.md) | [lab](week10/polymorphism_lab/README.md) |
| 11 | Abstraction | [lecture](week11/abstraction-lecture.md) | [lab](week11/abstraction_lab/README.md) |
| 12 | **MCQ 3** · held during lab slot | [details](week12/README.md) · [brief](../mcq/README.md) | — |
<!-- schedule-table:end -->

## Getting started (once)

1. **Use this template → Create a new repository** (the green button,
   top-right on the module's GitHub page; not *Fork*, because a fork can't
   be private), or open
   [this link](https://github.com/new?template_owner=danielcregg&template_name=object-oriented-computing&visibility=private&name=object-oriented-computing-module),
   which fills that form in for you. That gives you your own copy to save
   work into. Keep the suggested name, **object-oriented-computing-module**,
   so the *Open Your Repo* button on Moodle can find it, and set it to
   **Private**: it's your work, not something anyone else needs to see.
2. On **your** repo: **Code → Codespaces → Create codespace** — a full Java
   IDE opens in your browser, nothing to install. *(Local instead? Clone
   your repo and open it in VS Code with JDK 21 (the same version as the
   Codespace) and the "Extension Pack for Java" installed — same
   experience.)*
3. **Save as you go** — see [Saving your work](#saving-your-work) below.
   A Codespace is not a save: GitHub deletes one that sits unused for 30
   days, and only what you have committed and pushed survives.

## Doing a lab

Open the week's lab folder (for example `week05/arrays_lab/`) and follow
its `README.md`. The `Main.java` there is ready to run with the ▶ button;
add your classes beside it. Two rules Java enforces when you create a file:
a `public` class must live in a file with exactly its name (`Book` in
`Book.java`), and every file in the folder starts with the same `package`
line as `Main.java`, which names the folder (for example
`package week05.arrays_lab;`).

Stuck? Every exercise has a **Hint** you can expand, and every expected
output is printed in the README — compare yours against it before asking.

## Saving your work

Git keeps your work, not the Codespace. After each exercise (or at least
before you close the browser):

1. Open the **Source Control** panel (the branch icon in the left bar, or
   `Ctrl+Shift+G`).
2. Type a one-line message such as `week05 DIY 3 done` in the box.
3. Click **Commit**, then **Sync Changes** (that is the push).

Your repo on GitHub now has the code, and stays there whatever happens to
the Codespace. Every push also runs a small check that compiles all your
lab code: a green tick means it all compiles, a red cross means one file
does not, and the message says which. (The Actions tab also lists the
module's own site builders as *skipped*: they are switched off in copies
by design. Ignore them.)

## Getting the latest lectures and lab instructions

If a lab or a lecture is corrected mid-semester, the fix reaches your copy
on its own: every night a small workflow in your repo (`course-sync`)
brings the latest course content in, and your Codespace catches up each
time you open it. So there is usually nothing to do. To get a fix this
minute instead, either:

1. **Press the button:** *Terminal → Run Task → Update course content*, or
2. **Run one line:**

   ```bash
   bash scripts/update-course-content.sh
   ```

It only ever refreshes the lectures, the lab instructions, the week pages,
the READMEs, an untouched `Main.java` starter and the Codespace's own setup
(if that changes, VS Code offers to rebuild the Codespace: say yes when
you're at a stopping point). **Your own code is never touched**, and if you
have edited one of those files yourself it keeps your version and tells you
so. If it says your repo on GitHub has newer commits, click **Sync
Changes** first, then run it again.

And the
**[module site](https://danielcregg.is-a.dev/object-oriented-computing/)**
is always current, whatever state your copy is in — so when in doubt,
read it there.
